import React, { useEffect, useState } from 'react';
import { coursesAPI, dueDiligenceAPI, eventsAPI, usersAPI } from '../api/endpoints';

const COLORS = { ink: '#172033', muted: '#64748B', line: '#E2E8F0', paper: '#FFFFFF', bg: '#F8FAFC', violet: '#5B21B6', teal: '#0F766E', amber: '#B45309', blue: '#1D4ED8' };
const unwrap = (response) => response?.data?.data ?? response?.data ?? [];
const list = (value) => Array.isArray(value) ? value : [];

function Metric({ label, value, note, color }) {
  return <article style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 18, boxShadow: '0 12px 28px rgba(15,23,42,.05)' }}>
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, marginBottom: 16 }} />
    <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ color: COLORS.ink, fontSize: 32, lineHeight: 1.1, fontWeight: 800, margin: '8px 0 6px' }}>{value}</div>
    <div style={{ color: COLORS.muted, fontSize: 12 }}>{note}</div>
  </article>;
}

export default function AdminOverview({ isMobile = false, onNavigate = () => {} }) {
  const [metrics, setMetrics] = useState({ loading: true, members: 0, courses: 0, events: 0, pending: 0, error: '' });

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      usersAPI.getAll({ take: 1000 }),
      coursesAPI.list({ skip: 0, take: 100 }),
      eventsAPI.list({ skip: 0, take: 100 }),
      eventsAPI.listPending(),
      dueDiligenceAPI.list({ limit: 100 }),
    ]).then((results) => {
      if (!active) return;
      const values = results.map((result) => result.status === 'fulfilled' ? list(unwrap(result.value)) : []);
      setMetrics({ loading: false, members: values[0].length, courses: values[1].length, events: values[2].length, pending: values[3].length + values[4].length, error: results.some((result) => result.status === 'rejected') ? 'Some live metrics could not be loaded.' : '' });
    });
    return () => { active = false; };
  }, []);

  const cards = [
    ['Community members', metrics.members, 'Registered accounts', COLORS.violet],
    ['Published courses', metrics.courses, 'Learning assets live', COLORS.teal],
    ['Live events', metrics.events, 'Published sessions', COLORS.blue],
    ['Pending reviews', metrics.pending, 'Events and diligence items', COLORS.amber],
  ];

  return <main style={{ minHeight: '100%', overflowY: 'auto', background: COLORS.bg, color: COLORS.ink, padding: isMobile ? 16 : 30, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <header style={{ marginBottom: 26 }}><div style={{ color: COLORS.violet, fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8 }}>Admin control room</div><h1 style={{ margin: 0, fontSize: isMobile ? 26 : 38, letterSpacing: '-.04em' }}>What is happening across Tribes</h1><p style={{ margin: '10px 0 0', color: COLORS.muted, maxWidth: 620, lineHeight: 1.6 }}>A live view of the community, learning content, events, and review queues.</p></header>
      {metrics.error && <div role="status" style={{ marginBottom: 18, padding: 11, borderRadius: 8, background: '#FFF7ED', border: '1px solid #FED7AA', color: COLORS.amber, fontSize: 13 }}>{metrics.error}</div>}
      <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 22 }}>{cards.map(([label, value, note, color]) => <Metric key={label} label={label} value={metrics.loading ? '—' : value} note={note} color={color} />)}</section>
      <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr .9fr', gap: 16 }}>
        <div style={{ background: 'linear-gradient(135deg, #172033 0%, #263452 100%)', color: '#fff', borderRadius: 14, padding: isMobile ? 20 : 28, minHeight: 240 }}><div style={{ color: '#A7F3D0', fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>Operator focus</div><h2 style={{ margin: '12px 0 10px', fontSize: 24, maxWidth: 430 }}>Keep the community moving with clear, timely decisions.</h2><p style={{ color: '#CBD5E1', lineHeight: 1.6, fontSize: 13, maxWidth: 470 }}>Publish useful learning, clear review queues, and keep members informed from one calm workspace.</p></div>
        <div style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20 }}><div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 14 }}>Quick actions</div><div style={{ display: 'grid', gap: 10 }}>{[['learning', 'Manage Learning Hub', 'Add courses and YouTube lessons'], ['announcements', 'Broadcast announcement', 'Reach every member at once'], ['vault', 'Review diligence', 'Keep the existing approval flow']].map(([page, title, note]) => <button key={page} onClick={() => onNavigate(page)} style={{ textAlign: 'left', border: `1px solid ${COLORS.line}`, borderRadius: 9, background: '#F8FAFC', padding: 13, cursor: 'pointer', color: COLORS.ink }}><strong>{title}</strong><span style={{ display: 'block', color: COLORS.muted, fontSize: 12, marginTop: 3 }}>{note}</span></button>)}</div></div>
      </section>
    </div>
  </main>;
}
