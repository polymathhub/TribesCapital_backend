import React, { useEffect, useMemo, useState } from 'react';
import { messagingMembersAPI } from '../api/messagingMembers';
import profilePlaceholderImage from '../assets/illustrations/Artist Woman (1).png';

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];
const displayName = (person) => `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || 'Member';

const formatLastSeen = (value) => {
  if (!value) return 'No recent activity';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No recent activity';
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Active just now';
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  return `Last seen ${Math.floor(hours / 24)}d ago`;
};

export default function MessagingMemberDirectory({ activeUserIds = [], onStartDirectMessage }) {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    messagingMembersAPI.list({ query: query.trim() || undefined, page, limit: 24 })
      .then((response) => {
        if (cancelled) return;
        const payload = unwrap(response);
        setMembers(Array.isArray(payload) ? payload : []);
        setMeta(response?.data?.meta || { total: 0, totalPages: 1 });
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, query]);

  const activeSet = useMemo(() => new Set(activeUserIds), [activeUserIds]);
  const sortedMembers = useMemo(() => [...members].sort((a, b) => Number(activeSet.has(b.id)) - Number(activeSet.has(a.id))), [activeSet, members]);

  return <section className="messaging-member-directory" aria-label="Members">
    <div className="member-directory-heading">
      <div><strong>All members</strong><span>{meta.total}</span></div>
      <small>Find someone to message</small>
    </div>
    <label className="member-directory-search">
      <span aria-hidden="true">⌕</span>
      <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search members" aria-label="Search members" />
    </label>
    <div className="member-directory-list">
      {loading ? <div className="member-directory-empty">Loading members…</div> : sortedMembers.length === 0 ? <div className="member-directory-empty">No members found.</div> : sortedMembers.map((member) => {
        const online = activeSet.has(member.id);
        return <button key={member.id} type="button" className="member-directory-item" onClick={() => onStartDirectMessage?.(member)}>
          <span className="member-directory-avatar"><img src={member.avatar || profilePlaceholderImage} alt="" onError={(event) => { event.currentTarget.src = profilePlaceholderImage; }} /><i className={online ? 'online' : ''} /></span>
          <span className="member-directory-copy"><strong>{displayName(member)}</strong><small>{online ? 'Online now' : formatLastSeen(member.lastSeenAt)}</small></span>
          <span className="member-directory-arrow" aria-hidden="true">→</span>
        </button>;
      })}
    </div>
    {meta.totalPages > 1 && <div className="member-directory-pagination"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {meta.totalPages}</span><button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
  </section>;
}
