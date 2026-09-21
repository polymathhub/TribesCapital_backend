import React, { useState } from 'react';
import { notificationsAPI } from '../api/endpoints';
import { COLORS } from '../constants/colors';

const isAdminUser = (user) => {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  return Boolean(user?.isAdmin || user?.role === 'admin' || roles.includes('admin') || roles.includes('super-admin'));
};

export default function AnnouncementsPage({ user, onBack, onToggleSidebar, isMobile, isTablet }) {
  const isMobileLocal = isMobile !== undefined ? isMobile : (typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '' });
  const [broadcastState, setBroadcastState] = useState({ busy: false, notice: '', error: '' });

  const submitBroadcast = async (event) => {
    event.preventDefault();
    setBroadcastState({ busy: true, notice: '', error: '' });
    try {
      await notificationsAPI.broadcast({ type: 'announcement', title: broadcast.title.trim(), message: broadcast.message.trim() });
      setBroadcast({ title: '', message: '' });
      setBroadcastState({ busy: false, notice: 'Announcement sent to every member.', error: '' });
    } catch (error) {
      setBroadcastState({ busy: false, notice: '', error: error?.response?.data?.message || 'Unable to send this announcement.' });
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontSize: 14, color: COLORS.T1, background: COLORS.BG }}>
      <div style={{ padding: isMobileLocal ? '16px' : '24px 30px', borderBottom: `1px solid ${COLORS.BD}`, background: COLORS.W, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobileLocal ? 22 : 30, fontWeight: 800, color: COLORS.T1, margin: 0 }}>Announcements</h1>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobileLocal ? 16 : 30, background: COLORS.BG }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {isAdminUser(user) && <form onSubmit={submitBroadcast} style={{ padding: isMobileLocal ? 18 : 24, borderRadius: 12, background: COLORS.W, color: COLORS.T1, border: `1px solid ${COLORS.BD}`, boxShadow: '0 12px 28px rgba(15,23,42,.05)' }}>
            <div style={{ color: COLORS.P, fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }}>Admin broadcast</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>Send an announcement to everyone</h2>
            <p style={{ color: COLORS.T2, fontSize: 13, margin: '0 0 16px' }}>This message will appear in every member's notification feed.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              <input required placeholder="Announcement title" value={broadcast.title} onChange={(event) => setBroadcast({ ...broadcast, title: event.target.value })} style={{ border: `1px solid ${COLORS.BD}`, borderRadius: 8, padding: '10px 12px', font: 'inherit', color: COLORS.T1, background: COLORS.W }} />
              <textarea required rows={4} placeholder="Write the announcement..." value={broadcast.message} onChange={(event) => setBroadcast({ ...broadcast, message: event.target.value })} style={{ border: `1px solid ${COLORS.BD}`, borderRadius: 8, padding: '10px 12px', font: 'inherit', color: COLORS.T1, background: COLORS.W, resize: 'vertical' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><span role={broadcastState.error ? 'alert' : 'status'} style={{ color: broadcastState.error ? COLORS.AM : COLORS.GR, fontSize: 12 }}>{broadcastState.error || broadcastState.notice}</span><button type="submit" disabled={broadcastState.busy} style={{ border: 0, borderRadius: 8, background: COLORS.P, color: COLORS.W, padding: '10px 14px', fontWeight: 800, cursor: broadcastState.busy ? 'wait' : 'pointer' }}>{broadcastState.busy ? 'Sending...' : 'Broadcast announcement'}</button></div>
            </div>
          </form>}
        </div>
      </div>
    </div>
  );
}
