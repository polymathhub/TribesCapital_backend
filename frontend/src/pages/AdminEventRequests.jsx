import React, { useCallback, useEffect, useState } from 'react';
import { eventsAPI } from '../api/endpoints';
import { COLORS } from '../constants/colors';

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];

const isAdminUser = (user) => {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  return Boolean(user?.isAdmin || user?.role === 'admin' || roles.includes('admin') || roles.includes('super-admin'));
};

const formatDate = (value) => {
  if (!value) return 'Date to be confirmed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed';
  return date.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function AdminEventRequests({ user, isMobile = false }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadRequests = useCallback(async () => {
    if (!isAdminUser(user)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await eventsAPI.listPending();
      const pending = unwrap(response);
      setRequests(Array.isArray(pending) ? pending : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to load pending event requests.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const approveRequest = async (request) => {
    setApprovingId(request.id);
    setError('');
    setNotice('');
    try {
      await eventsAPI.approve(request.id);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setNotice(`${request.title || 'Event'} is now published.`);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to approve this event request.');
    } finally {
      setApprovingId(null);
    }
  };

  if (!isAdminUser(user)) {
    return <main style={{ padding: isMobile ? 20 : 36, color: COLORS.T2 }}>This room is available to administrators only.</main>;
  }

  return (
    <main style={{ minHeight: '100%', padding: isMobile ? 20 : 36, background: COLORS.BG, color: COLORS.T1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 8px', color: COLORS.AM, fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>Admin room</p>
            <h1 style={{ margin: 0, fontSize: isMobile ? 26 : 32, letterSpacing: -0.4 }}>Pending event requests</h1>
            <p style={{ margin: '10px 0 0', color: COLORS.T2, fontSize: 15, lineHeight: 1.55 }}>Review community event submissions before they go live.</p>
          </div>
          <button type="button" onClick={() => void loadRequests()} disabled={loading} style={{ border: `1px solid ${COLORS.BD}`, borderRadius: 8, background: COLORS.W, color: COLORS.T1, padding: '10px 14px', cursor: loading ? 'wait' : 'pointer', fontWeight: 600 }}>
            {loading ? 'Refreshing...' : 'Refresh requests'}
          </button>
        </header>

        {error && <div role="alert" style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 8, background: COLORS.AMB, color: '#92400E', border: '1px solid #FCD34D' }}>{error}</div>}
        {notice && <div role="status" style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 8, background: COLORS.GRB, color: '#047857', border: '1px solid #A7F3D0' }}>{notice}</div>}

        {loading ? <div style={{ padding: 28, background: COLORS.W, border: `1px solid ${COLORS.BD}`, borderRadius: 12, color: COLORS.T2 }}>Loading pending requests...</div> : requests.length === 0 ? (
          <section style={{ padding: isMobile ? 28 : 48, textAlign: 'center', background: COLORS.W, border: `1px solid ${COLORS.BD}`, borderRadius: 12 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Nothing waiting for review</h2>
            <p style={{ margin: 0, color: COLORS.T2 }}>New event requests will appear here when members submit them.</p>
          </section>
        ) : (
          <section aria-label="Pending event requests" style={{ display: 'grid', gap: 14 }}>
            {requests.map((request) => (
              <article key={request.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', padding: isMobile ? 18 : 22, background: COLORS.W, border: `1px solid ${COLORS.BD}`, borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.04)' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: COLORS.AMB, color: COLORS.AM, fontSize: 11, fontWeight: 700 }}>PENDING</span>
                    <span style={{ color: COLORS.T2, fontSize: 12 }}>{request.eventType || 'Event'}</span>
                  </div>
                  <h2 style={{ margin: '0 0 8px', fontSize: 19 }}>{request.title || 'Untitled event'}</h2>
                  <p style={{ margin: '0 0 12px', color: COLORS.T2, lineHeight: 1.5 }}>{request.description || 'No description provided.'}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', color: COLORS.T2, fontSize: 13 }}>
                    <span>{formatDate(request.startDate)}</span>
                    <span>{request.location || (request.isVirtual ? 'Virtual' : 'Location not provided')}</span>
                    {request.capacity ? <span>{request.capacity} seats</span> : null}
                  </div>
                </div>
                <button type="button" onClick={() => void approveRequest(request)} disabled={approvingId === request.id} style={{ border: 'none', borderRadius: 8, background: COLORS.GR, color: COLORS.W, padding: '10px 15px', cursor: approvingId === request.id ? 'wait' : 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {approvingId === request.id ? 'Publishing...' : 'Approve and publish'}
                </button>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
