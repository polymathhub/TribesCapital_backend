import React, { useEffect, useMemo, useState } from 'react';
import { analyticsAPI } from '../api/endpoints';
import { COLORS } from '../constants/colors';

const RANGE_OPTIONS = [
  ['7d', 'Last 7 days'],
  ['30d', 'Last 30 days'],
  ['90d', 'Last 90 days'],
  ['12mo', 'Last 12 months'],
  ['custom', 'Custom range'],
];

const unwrap = (response) => response?.data?.data ?? response?.data ?? {};
const formatNumber = (value) => Number(value || 0).toLocaleString();

function MetricCard({ label, value, note, accent }) {
  return (
    <article className="admin-analytics-metric" style={{ '--metric-accent': accent }}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="admin-analytics-panel">
      <header><div><h2>{title}</h2><p>{subtitle}</p></div></header>
      {children}
    </section>
  );
}

function LineChart({ data, label }) {
  if (!data.length) return <div className="admin-analytics-empty">No data in this date range.</div>;
  const width = 720;
  const height = 220;
  const inset = { top: 16, right: 18, bottom: 34, left: 34 };
  const max = Math.max(1, ...data.map((item) => item.count));
  const points = data.map((item, index) => {
    const x = inset.left + (data.length === 1 ? 0 : index * (width - inset.left - inset.right) / (data.length - 1));
    const y = inset.top + (height - inset.top - inset.bottom) * (1 - item.count / max);
    return `${x},${y}`;
  });
  const firstDate = new Date(data[0].date);
  const lastDate = new Date(data[data.length - 1].date);
  const dateLabel = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

  return (
    <div className="admin-analytics-chart-wrap">
      <svg className="admin-analytics-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        {[0, 1, 2, 3].map((step) => {
          const y = inset.top + (height - inset.top - inset.bottom) * step / 3;
          return <line key={step} x1={inset.left} x2={width - inset.right} y1={y} y2={y} className="chart-grid-line" />;
        })}
        <polyline points={points.join(' ')} fill="none" stroke={COLORS.P} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => {
          const [x, y] = points[index].split(',').map(Number);
          return <circle key={item.date} cx={x} cy={y} r="4" fill={COLORS.P}><title>{`${dateLabel(new Date(item.date))}: ${formatNumber(item.count)}`}</title></circle>;
        })}
        <text x={inset.left} y={height - 8} className="chart-axis-label">{dateLabel(firstDate)}</text>
        <text x={width - inset.right} y={height - 8} textAnchor="end" className="chart-axis-label">{dateLabel(lastDate)}</text>
      </svg>
      <div className="admin-analytics-chart-foot"><span>{formatNumber(data.reduce((sum, item) => sum + item.count, 0))} total</span><span>{data.length} reporting {data.length === 1 ? 'period' : 'periods'}</span></div>
    </div>
  );
}

function ActivityChart({ data }) {
  if (!data.length) return <div className="admin-analytics-empty">No activity in this date range.</div>;
  const series = [
    ['registrations', 'Event registrations', COLORS.P],
    ['learning', 'Learning activity', COLORS.TL],
    ['community', 'Community posts & comments', COLORS.AM],
  ];
  const max = Math.max(1, ...data.flatMap((row) => series.map(([key]) => row[key])));
  return (
    <div className="admin-analytics-activity-chart">
      <div className="admin-analytics-legend">{series.map(([, name, color]) => <span key={name}><i style={{ background: color }} />{name}</span>)}</div>
      {data.map((row) => (
        <div className="admin-analytics-activity-row" key={row.date}>
          <time>{new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}</time>
          <div className="admin-analytics-activity-bars">
            {series.map(([key, name, color]) => <span key={key} title={`${name}: ${formatNumber(row[key])}`} style={{ width: `${Math.max(row[key] ? 2 : 0, row[key] / max * 100)}%`, background: color }} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Breakdown({ rows, nameKey, emptyText }) {
  if (!rows.length) return <div className="admin-analytics-empty">{emptyText}</div>;
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="admin-analytics-breakdown">
      {rows.map((row) => (
        <div className="admin-analytics-breakdown-item" key={row[nameKey]}>
          <div><span>{row[nameKey]}</span><b>{formatNumber(row.count)}</b></div>
          <div className="admin-analytics-breakdown-track"><i style={{ width: `${Math.max(row.count ? 2 : 0, row.count / max * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalytics({ isMobile = false, isTablet = false }) {
  const [range, setRange] = useState('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [contentType, setContentType] = useState('');
  const [eventType, setEventType] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const customDatesInvalid = range === 'custom' && (!from || !to || from > to);
  const query = useMemo(() => ({
    range,
    ...(range === 'custom' ? { from, to } : {}),
    ...(contentType ? { contentType } : {}),
    ...(eventType ? { eventType } : {}),
  }), [range, from, to, contentType, eventType]);

  useEffect(() => {
    if (customDatesInvalid) {
      setLoading(false);
      setReport(null);
      setError(from && to ? 'The start date must be on or before the end date.' : '');
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    analyticsAPI.getAdminReport(query, { signal: controller.signal })
      .then((response) => setReport(unwrap(response)))
      .catch((requestError) => {
        if (requestError.code === 'ERR_CANCELED') return;
        setError(requestError?.response?.data?.message || 'Unable to load analytics data.');
        setReport(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, customDatesInvalid, from, to]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ['Tribes Capital analytics report'],
      ['Date range', report.range?.from, report.range?.to],
      [],
      ['Metric', 'Value'],
      ...Object.entries(report.kpis || {}),
      [],
      ['User growth date', 'Signups'],
      ...(report.userGrowth || []).map((item) => [item.date, item.count]),
      [],
      ['Engagement date', 'Event registrations', 'Learning activity', 'Community activity'],
      ...(report.engagement || []).map((item) => [item.date, item.registrations, item.learning, item.community]),
      [],
      ['Event type', 'Attendee count'],
      ...(report.eventAttendance || []).map((item) => [item.type, item.count]),
      [],
      ['Content category', 'Published courses', 'Learning activity'],
      ...(report.contentDistribution || []).map((item) => [item.category, item.count]),
      [],
      ['Learning activity category', 'Lesson activity records'],
      ...(report.resourcePerformance || []).map((item) => [item.category, item.count]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tribes-analytics-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const kpis = report?.kpis;
  const metricCards = [
    ['Total members', kpis?.members, 'Registered accounts', COLORS.P],
    ['New signups', kpis?.newSignups, kpis?.signupChange === null ? 'No previous-period baseline' : `${kpis?.signupChange > 0 ? '+' : ''}${kpis?.signupChange}% vs previous period`, COLORS.TL],
    ['Active members', kpis?.activeUsers, 'Members with activity in range', COLORS.BLU],
    ['Event registrations', kpis?.eventRegistrations, 'Attending RSVPs in range', COLORS.AM],
    ['Published courses', kpis?.publishedCourses, 'Currently published', '#7C3AED'],
    ['Published events', kpis?.publishedEvents, 'Currently published', '#0F766E'],
  ];
  const pagePadding = isMobile ? '24px 18px 32px' : isTablet ? '30px 24px 40px' : '32px 32px 44px';

  return (
    <main className="admin-analytics-page" style={{ padding: pagePadding }}>
      <style>{`
        .admin-analytics-page{min-height:100%;box-sizing:border-box;background:${COLORS.BG};color:${COLORS.T1};font-family:ui-sans-serif,system-ui,sans-serif}
        .admin-analytics-inner{max-width:1320px;margin:0 auto}
        .admin-analytics-header{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:22px}
        .admin-analytics-eyebrow{margin:0 0 8px;color:${COLORS.P};font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
        .admin-analytics-header h1{margin:0;font-size:${isMobile ? '27px' : '34px'};letter-spacing:-.04em}
        .admin-analytics-header p{margin:8px 0 0;color:${COLORS.T2};font-size:13px;line-height:1.6}
        .admin-analytics-export{flex:0 0 auto;border:0;border-radius:9px;background:${COLORS.P};color:#fff;padding:11px 16px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
        .admin-analytics-export:disabled{opacity:.5;cursor:not-allowed}
        .admin-analytics-filters{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;padding:13px;background:#fff;border:1px solid ${COLORS.BD};border-radius:12px}
        .admin-analytics-filters select,.admin-analytics-filters input{min-width:145px;height:40px;padding:0 11px;border:1px solid ${COLORS.BD};border-radius:8px;background:#fff;color:${COLORS.T1};font:inherit;font-size:12px}
        .admin-analytics-date-label{display:flex;align-items:center;gap:7px;color:${COLORS.T2};font-size:12px}
        .admin-analytics-error{margin-bottom:16px;padding:12px 14px;border:1px solid #FCD34D;border-radius:9px;background:${COLORS.AMB};color:${COLORS.AM};font-size:13px}
        .admin-analytics-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}
        .admin-analytics-metric{display:flex;min-width:0;flex-direction:column;gap:7px;padding:17px 18px;background:#fff;border:1px solid ${COLORS.BD};border-top:3px solid var(--metric-accent);border-radius:12px;box-shadow:0 8px 22px rgba(15,23,42,.04)}
        .admin-analytics-metric span{color:var(--metric-accent);font-size:11px;font-weight:750;letter-spacing:.04em;text-transform:uppercase}
        .admin-analytics-metric strong{font-size:28px;line-height:1.1;overflow-wrap:anywhere}
        .admin-analytics-metric small{color:${COLORS.T2};font-size:11px}
        .admin-analytics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .admin-analytics-panel{min-width:0;padding:19px;background:#fff;border:1px solid ${COLORS.BD};border-radius:13px;box-shadow:0 8px 22px rgba(15,23,42,.04)}
        .admin-analytics-panel header{margin-bottom:14px}
        .admin-analytics-panel h2{margin:0;font-size:15px;font-weight:700}
        .admin-analytics-panel header p{margin:4px 0 0;color:${COLORS.T2};font-size:11px}
        .admin-analytics-chart-wrap{min-width:0}
        .admin-analytics-line-chart{display:block;width:100%;height:auto;overflow:visible}
        .chart-grid-line{stroke:#ECECF1;stroke-width:1}
        .chart-axis-label{fill:${COLORS.T3};font-size:11px}
        .admin-analytics-chart-foot{display:flex;justify-content:space-between;gap:10px;color:${COLORS.T3};font-size:11px}
        .admin-analytics-empty{display:grid;min-height:190px;place-items:center;color:${COLORS.T3};font-size:12px}
        .admin-analytics-legend{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px}
        .admin-analytics-legend span{display:inline-flex;align-items:center;gap:5px;color:${COLORS.T2};font-size:10px}
        .admin-analytics-legend i{width:8px;height:8px;border-radius:50%}
        .admin-analytics-activity-chart{display:grid;gap:9px}
        .admin-analytics-activity-row{display:grid;grid-template-columns:55px 1fr;align-items:center;gap:9px}
        .admin-analytics-activity-row time{color:${COLORS.T3};font-size:10px}
        .admin-analytics-activity-bars{display:grid;gap:3px}
        .admin-analytics-activity-bars span{height:6px;min-width:0;border-radius:99px}
        .admin-analytics-breakdown{display:grid;gap:13px}
        .admin-analytics-breakdown-item>div:first-child{display:flex;justify-content:space-between;gap:10px;margin-bottom:6px;font-size:12px}
        .admin-analytics-breakdown-item span{overflow:hidden;color:${COLORS.T2};text-overflow:ellipsis;white-space:nowrap}
        .admin-analytics-breakdown-item b{color:${COLORS.T1}}
        .admin-analytics-breakdown-track{height:7px;overflow:hidden;border-radius:99px;background:#F0EDF4}
        .admin-analytics-breakdown-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,${COLORS.P},${COLORS.PL})}
        .admin-analytics-recent{grid-column:1/-1}
        .admin-analytics-recent-list{display:grid}
        .admin-analytics-recent-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid ${COLORS.BD};font-size:12px}
        .admin-analytics-recent-item:last-child{border-bottom:0}
        .admin-analytics-recent-item span{color:${COLORS.T2}}
        .admin-analytics-recent-item time{flex:0 0 auto;color:${COLORS.T3};font-size:11px}
        @media(max-width:760px){.admin-analytics-header{align-items:flex-start;flex-direction:column}.admin-analytics-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-analytics-grid{grid-template-columns:1fr}.admin-analytics-recent{grid-column:auto}}
        @media(max-width:430px){.admin-analytics-metrics{grid-template-columns:1fr}.admin-analytics-filters>*{width:100%}.admin-analytics-filters select,.admin-analytics-filters input{width:100%}.admin-analytics-date-label{align-items:flex-start;flex-direction:column}}
      `}</style>
      <div className="admin-analytics-inner">
        <header className="admin-analytics-header">
          <div><p className="admin-analytics-eyebrow">Admin control room</p><h1>Platform analytics</h1><p>Explore real signups, event registrations, learning activity, and community engagement.</p></div>
          <button className="admin-analytics-export" type="button" onClick={exportCsv} disabled={!report || loading}>Export report</button>
        </header>
        <div className="admin-analytics-filters" aria-label="Analytics filters">
          <select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Date range">
            {RANGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {range === 'custom' && <>
            <label className="admin-analytics-date-label">From <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label>
            <label className="admin-analytics-date-label">To <input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label>
          </>}
          <select value={contentType} onChange={(event) => setContentType(event.target.value)} aria-label="Content category">
            <option value="">All content categories</option>
            {(report?.filters?.contentTypes || []).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={eventType} onChange={(event) => setEventType(event.target.value)} aria-label="Event type">
            <option value="">All event types</option>
            {(report?.filters?.eventTypes || []).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        {error && <div className="admin-analytics-error" role="alert">{error}</div>}
        {range === 'custom' && !error && customDatesInvalid && <div className="admin-analytics-error" role="status">Choose a start and end date to load a custom report.</div>}
        <section className="admin-analytics-metrics" aria-label="Analytics summary">
          {metricCards.map(([label, value, note, accent]) => <MetricCard key={label} label={label} value={loading || !report ? '—' : formatNumber(value)} note={note || ''} accent={accent} />)}
        </section>
        {loading && <p role="status" style={{ color: COLORS.T2, fontSize: 12 }}>Loading analytics…</p>}
        {report && !loading && <>
          <div className="admin-analytics-grid">
            <Panel title="User growth" subtitle="Accounts created in each reporting period">
              <LineChart data={report.userGrowth || []} label="User signups over time" />
            </Panel>
            <Panel title="Platform activity" subtitle="Event RSVPs, lesson activity, and community activity">
              <ActivityChart data={report.engagement || []} />
            </Panel>
            <Panel title="Event attendance" subtitle="Attendee registrations grouped by published event type">
              <Breakdown rows={report.eventAttendance || []} nameKey="type" emptyText="No event registrations in this date range." />
            </Panel>
            <Panel title="Published content" subtitle="Courses grouped by category">
              <Breakdown rows={report.contentDistribution || []} nameKey="category" emptyText="No published courses found." />
            </Panel>
            <Panel title="Learning activity" subtitle="Lesson progress records grouped by course category">
              <Breakdown rows={report.resourcePerformance || []} nameKey="category" emptyText="No learning activity in this date range." />
            </Panel>
            <Panel title="Recent activity" subtitle="Latest platform records in the selected date range">
              {(report.recentActivity || []).length === 0 ? <div className="admin-analytics-empty">No recent activity found.</div> : (
                <div className="admin-analytics-recent-list">
                  {report.recentActivity.map((item, index) => <div className="admin-analytics-recent-item" key={`${item.kind}-${item.occurredAt}-${index}`}><strong>{item.label}</strong><time>{new Date(item.occurredAt).toLocaleString()}</time></div>)}
                </div>
              )}
            </Panel>
          </div>
        </>}
      </div>
    </main>
  );
}
