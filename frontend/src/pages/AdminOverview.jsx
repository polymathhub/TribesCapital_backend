import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../api/endpoints';

const COLORS = { ink: '#172033', muted: '#64748B', line: '#E2E8F0', paper: '#FFFFFF', bg: '#F8FAFC', violet: '#5B21B6', teal: '#0F766E', amber: '#B45309', blue: '#1D4ED8' };
const unwrap = (response) => response?.data?.data ?? response?.data ?? [];

function Metric({ label, value, note, color }) {
  return <article style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, boxShadow: '0 12px 28px rgba(15,23,42,.05)' }}>
    <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ color: COLORS.ink, fontSize: 32, lineHeight: 1.1, fontWeight: 800, margin: '8px 0 6px' }}>{value}</div>
    <div style={{ color: COLORS.muted, fontSize: 12 }}>{note}</div>
  </article>;
}

export default function AdminOverview({ isMobile = false, onNavigate = () => {} }) {
  const [metrics, setMetrics] = useState({ loading: true, members: 0, newSignups: 0, publishedVideos: 0, announcementUpdates: 0, publishedCourses: 0, publishedEvents: 0, pendingEvents: 0, periodDays: 30, error: '' });

  useEffect(() => {
    let active = true;
    analyticsAPI.getAdminOverview()
      .then((response) => {
        if (!active) return;
        const overview = unwrap(response);
        setMetrics({ loading: false, ...overview, error: '' });
      })
      .catch((error) => {
        if (!active) return;
        setMetrics((current) => ({ ...current, loading: false, error: error?.response?.data?.message || 'Unable to load live admin metrics.' }));
      });
    return () => { active = false; };
  }, []);

  const cards = [
    ['Community members', metrics.members, 'All registered accounts', COLORS.violet],
    ['New signups', metrics.newSignups, `Last ${metrics.periodDays} days`, COLORS.teal],
    ['Published videos', metrics.publishedVideos, 'YouTube lessons live', COLORS.blue],
    ['Announcement updates', metrics.announcementUpdates, `Broadcasts in ${metrics.periodDays} days`, COLORS.amber],
  ];

  return <main style={{ minHeight: '100%', overflowY: 'auto', background: COLORS.bg, color: COLORS.ink, padding: isMobile ? 16 : 30, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <header style={{ marginBottom: 26 }}><div style={{ color: COLORS.violet, fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8 }}>Admin control room</div><h1 style={{ margin: 0, fontSize: isMobile ? 26 : 38, letterSpacing: '-.04em' }}>What is happening across Tribes</h1><p style={{ margin: '10px 0 0', color: COLORS.muted, maxWidth: 620, lineHeight: 1.6 }}>A live view of the community, learning content, events, and review queues.</p></header>
      {metrics.error && <div role="status" style={{ marginBottom: 18, padding: 11, borderRadius: 8, background: '#FFF7ED', border: '1px solid #FED7AA', color: COLORS.amber, fontSize: 13 }}>{metrics.error}</div>}
      <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 22 }}>{cards.map(([label, value, note, color]) => <Metric key={label} label={label} value={metrics.loading ? '—' : value} note={note} color={color} />)}</section>
      <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr .9fr', gap: 16 }}>
        <div style={{ background: COLORS.paper, color: COLORS.ink, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: isMobile ? 20 : 28, minHeight: 240, boxShadow: '0 12px 28px rgba(15,23,42,.05)' }}><div style={{ color: COLORS.violet, fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>Live activity</div><h2 style={{ margin: '12px 0 10px', fontSize: 24, maxWidth: 430 }}>Stay close to the community pulse.</h2><p style={{ color: COLORS.muted, lineHeight: 1.6, fontSize: 13, maxWidth: 470 }}>There are {metrics.loading ? '—' : metrics.publishedCourses} published courses, {metrics.loading ? '—' : metrics.publishedEvents} live events, and {metrics.loading ? '—' : metrics.pendingEvents} pending event reviews in the platform.</p></div>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20 }}><div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Quick actions</div><div style={{ display: 'grid', gap: 10 }}>{[['learning', 'Manage Learning Hub', 'Add courses and YouTube lessons'], ['announcements', 'Broadcast announcement', 'Reach every member at once'], ['vault', 'Review diligence', 'Keep the existing approval flow']].map(([page, title, note]) => <button key={page} onClick={() => onNavigate(page)} style={{ textAlign: 'left', border: `1px solid ${COLORS.line}`, borderRadius: 9, background: '#F8FAFC', padding: 13, cursor: 'pointer', color: COLORS.ink }}><strong>{title}</strong><span style={{ display: 'block', color: COLORS.muted, fontSize: 12, marginTop: 3 }}>{note}</span></button>)}</div></div>
      </section>
    </div>
  </main>;
}
