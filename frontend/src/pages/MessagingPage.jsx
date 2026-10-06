import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { HugeiconsIcon } from '@hugeicons/react';
import { BubbleChatIcon } from '@hugeicons/core-free-icons';
import { communityAPI, messagingAPI } from '../api/endpoints';
import { uploadFileInChunks } from '../utils/chunkedUpload';
import { downloadFileFromUrl } from '../utils/chunkedUpload';
import { messagingMembersAPI } from '../api/messagingMembers';
import Icon from '../components/Icon';
import InitialsAvatar from '../components/InitialsAvatar';
import './messaging.css';
import './messaging-mobile.css';
import './messaging-people-polish.css';
import './messaging-advanced.css';
import './messaging-connections.css';

const EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '💯', '🙏'];
const unwrap = (response) => response?.data?.data ?? response?.data ?? [];
const unwrapMembers = (response) => {
  const payload = unwrap(response);
  const members = payload?.data ?? payload;
  return Array.isArray(members) ? members : [];
};
const displayName = (person) => {
  const source = person?.user || person?.profile || person;
  if (source?.displayName) return source.displayName;
  const fullName = `${source?.firstName || ''} ${source?.lastName || ''}`.trim();
  return fullName || source?.name || source?.email || person?.email || 'Member';
};
const formatTime = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
const resolveAttachmentUrl = (url) => {
  if (!url || url === '#') return '';
  try {
    if (/^[a-z][a-z\d+.-]*:/i.test(url)) return url;
    const configured = (import.meta.env.VITE_API_URL || '').trim();
    const base = configured ? new URL(configured).origin : window.location.origin;
    return new URL(url, base).toString();
  } catch {
    return url;
  }
};
const isImageAttachment = (attachment) => attachment?.mimeType?.startsWith('image/');
const isPreviewableAttachment = (attachment) => isImageAttachment(attachment) || attachment?.mimeType === 'application/pdf' || attachment?.mimeType?.startsWith('text/');
const resolveSocketUrl = () => {
  const configured = (import.meta.env.VITE_API_URL || '').trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      return `${parsed.protocol === 'https:' ? 'https' : 'http'}://${parsed.host}`;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
};

const emitWithAck = (socket, event, payload, timeout = 10000) => new Promise((resolve, reject) => {
  if (!socket?.connected) { reject(new Error('Realtime connection is not available')); return; }
  let settled = false;
  const timer = window.setTimeout(() => { if (!settled) { settled = true; reject(new Error('Realtime request timed out')); } }, timeout);
  socket.emit(event, payload, (response) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    if (!response?.ok) reject(new Error(response?.message || `Unable to complete ${event}`));
    else resolve(response);
  });
});

function Avatar({ person, size = 'md', onClick }) {
  const content = person?.avatar
    ? <span className={`message-avatar message-avatar-${size}`} title={displayName(person)}><img src={person.avatar} alt={`${displayName(person)} profile`} onError={(event) => { event.currentTarget.style.display = 'none'; }} /></span>
    : <InitialsAvatar person={person} className={`message-avatar message-avatar-${size}`} alt={`${displayName(person)} profile`} />;

  if (!onClick) return content;

  return <button type="button" className="avatar-button" onClick={onClick} aria-label={`Open ${displayName(person)} profile`}>{content}</button>;
}

function AttachmentPreview({ attachment, onClose }) {
  const [downloadProgress, setDownloadProgress] = useState(null);
  const url = resolveAttachmentUrl(attachment.url);
  const previewable = isPreviewableAttachment(attachment);
  const download = async () => {
    setDownloadProgress(0);
    try {
      let downloadUrl = attachment.url;
      if (attachment.id) {
        const result = unwrap(await messagingAPI.getAttachmentDownloadUrl(attachment.id));
        downloadUrl = result?.url || downloadUrl;
      }
      await downloadFileFromUrl(downloadUrl, attachment.fileName || 'attachment', setDownloadProgress);
      setDownloadProgress(100);
    } catch (error) {
      setDownloadProgress(null);
      window.alert(error?.message || 'Unable to download this attachment.');
    }
  };
  return <div className="attachment-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="attachment-preview" role="dialog" aria-modal="true" aria-label={`Preview ${attachment.fileName}`}>
      <header><div><strong>{attachment.fileName}</strong><small>{attachment.mimeType || 'Attachment'}</small></div><button type="button" onClick={onClose} aria-label="Close preview">×</button></header>
      <div className="attachment-preview-body">
        {!url ? <p className="attachment-unavailable">This attachment is still uploading.</p> : !previewable ? <div className="attachment-unavailable"><Icon name="file" size={28} /><p>Preview is not available for this file type.</p></div> : isImageAttachment(attachment) ? <img src={url} alt={attachment.fileName} onError={(event) => { event.currentTarget.replaceWith(Object.assign(document.createElement('p'), { className: 'attachment-unavailable', textContent: 'This attachment is no longer available.' })); }} /> : <iframe src={url} title={`Preview of ${attachment.fileName}`} />}
      </div>
      {url && <footer className="attachment-preview-download"><button type="button" className="attachment-download-button" onClick={() => void download()} disabled={downloadProgress !== null && downloadProgress !== 100}>Download file</button>{downloadProgress !== null && <span role="status">{downloadProgress === 100 ? 'Download ready' : downloadProgress ? `Downloading ${downloadProgress}%` : 'Downloading…'}{downloadProgress < 100 && <progress value={downloadProgress || undefined} max="100" />}</span>}</footer>}
    </section>
  </div>;
}

function ActionIcon({ type }) {
  const paths = {
    reply: <path d="M7 9.5 3.5 13 7 16.5M4 13h7.5a5.5 5.5 0 0 0 0-11H8" />,
    smile: <><circle cx="10" cy="10" r="7.5" /><path d="M7 9h.01M13 9h.01M6.8 12.2a4 4 0 0 0 6.4 0" /></>,
    more: <><circle cx="5" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" /></>,
    close: <><path d="m5 5 10 10M15 5 5 15" /></>,
    send: <path d="m3 3 14 7-14 7 3.5-7L3 3Zm3.5 7H17" />,
  };
  return <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function MessageRow({ message, user, onReply, onReact, onEdit, onDelete, onRetry, onOpenProfile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const grouped = reactions.reduce((groups, item) => ({ ...groups, [item.reaction]: [...(groups[item.reaction] || []), item] }), {});
  const mine = message.senderId === user?.id;
  const profilePerson = message.sender || (mine ? user : null);
  const readByAnotherUser = Array.isArray(message.reads) ? message.reads.some((receipt) => receipt.userId !== user?.id) : Boolean(message.isRead);
  return <article className={`message-row ${mine ? 'mine' : ''} ${message.sendFailed ? 'send-failed' : ''}`}>
    <Avatar person={profilePerson} onClick={profilePerson && onOpenProfile ? () => onOpenProfile(profilePerson) : undefined} />
    <div className="message-content-wrap">
      <div className="message-meta"><strong onClick={profilePerson && onOpenProfile ? () => onOpenProfile(profilePerson) : undefined} style={{ cursor: profilePerson && onOpenProfile ? 'pointer' : 'default' }}>{mine ? 'You' : displayName(message.sender)}</strong>{message.isOptimistic && <span className="message-state">Sending…</span>}{message.sendFailed && <span className="message-state error">Not sent</span>}{message.isEdited && <span className="message-edited">edited</span>}</div>
      {message.replyTo && <button className="reply-context" type="button" onClick={() => onReply(message.replyTo)}><span>Replying to {displayName(message.replyTo.sender)}</span><strong>{message.replyTo.content || '[attachment]'}</strong></button>}
      <div className={`message-bubble ${message.isDeleted ? 'deleted' : ''}`}><p>{message.content || (message.attachments?.length ? '' : '[empty message]')}</p>{message.attachments?.length > 0 && <div className="message-attachments">{message.attachments.map((attachment) => <button key={attachment.id || attachment.url} type="button" className={`attachment-card ${isImageAttachment(attachment) ? 'image-attachment' : ''} ${attachment.url === '#' ? 'pending' : ''}`} onClick={() => setPreviewAttachment(attachment)}>{isImageAttachment(attachment) && attachment.url !== '#' ? <img src={resolveAttachmentUrl(attachment.url)} alt="" className="attachment-thumbnail" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span className="attachment-icon"><Icon name="file" size={16} /></span>}<span><strong>{attachment.fileName}</strong><small>{isPreviewableAttachment(attachment) ? 'Preview' : attachment.mimeType || 'Attachment'}</small></span></button>)}</div>}</div>
      <div className="message-footer"><time>{formatTime(message.createdAt)}</time>{mine && !message.isOptimistic && !message.sendFailed && <span className={`message-receipt ${readByAnotherUser ? 'read' : ''}`} aria-label={readByAnotherUser ? 'Read' : 'Sent'}><span aria-hidden="true">{readByAnotherUser ? '✓✓' : '✓'}</span>{readByAnotherUser ? 'Read' : 'Sent'}</span>}</div>
      {previewAttachment && <AttachmentPreview attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />}
      {message.sendFailed && <button type="button" className="message-retry" onClick={() => onRetry(message)}>Retry sending</button>}
      {Object.keys(grouped).length > 0 && <div className="reaction-list">{Object.entries(grouped).map(([reaction, items]) => <button key={reaction} type="button" className={`reaction-chip ${items.some((item) => item.userId === user?.id) ? 'mine' : ''}`} onClick={() => onReact(message.id, reaction)}><span>{reaction}</span><small>{items.length}</small></button>)}</div>}
    </div>
    {!message.sendFailed && <div className="message-actions">
      <button type="button" onClick={() => onReply(message)} aria-label="Reply in thread" title="Reply in thread"><ActionIcon type="reply" /></button>
      <button type="button" onClick={() => setReactionOpen((open) => !open)} aria-label="Add reaction" title="Add reaction"><ActionIcon type="smile" /></button>
      <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="More message actions" title="More"><ActionIcon type="more" /></button>
      {reactionOpen && <div className="reaction-picker" role="menu">{EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => { setReactionOpen(false); onReact(message.id, emoji); }} aria-label={`React ${emoji}`}>{emoji}</button>)}</div>}
      {menuOpen && <div className="message-menu">{mine && <button type="button" onClick={() => { setMenuOpen(false); onEdit(message); }}>Edit</button>}{mine && <button type="button" onClick={() => { setMenuOpen(false); onDelete(message); }}>Delete</button>}<button type="button" onClick={() => { setMenuOpen(false); navigator.clipboard?.writeText(message.content || ''); }}>Copy</button></div>}
    </div>}
  </article>;
}

function ConversationModal({ open, mode, setMode, members, query, setQuery, selectedIds, setSelectedIds, groupName, setGroupName, loading, onClose, onCreate }) {
  if (!open) return null;
  const toggle = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const valid = mode === 'direct' ? selectedIds.length === 1 : Boolean(groupName.trim()) && selectedIds.length > 0;
  return <div className="messaging-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="messaging-modal" role="dialog" aria-modal="true" aria-labelledby="new-conversation-title">
      <header><div><span className="modal-eyebrow">New conversation</span><h2 id="new-conversation-title">Start with the right people</h2><p>Send a private message or create a named group without creating a channel first.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><ActionIcon type="close" /></button></header>
      <div className="conversation-mode-switch"><button type="button" className={mode === 'direct' ? 'active' : ''} onClick={() => { setMode('direct'); setSelectedIds([]); }}>Direct message</button><button type="button" className={mode === 'group' ? 'active' : ''} onClick={() => { setMode('group'); setSelectedIds([]); }}>Named group</button></div>
      {mode === 'group' && <label className="modal-field"><span>Group name</span><input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={160} placeholder="e.g. Product launch" autoFocus /></label>}
      <label className="modal-field"><span>{mode === 'direct' ? 'Choose a person' : 'Add people'}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people by name or email" /></label>
      <div className="selected-member-pills">{selectedIds.map((id) => { const person = members.find((member) => member.id === id); return person ? <button type="button" key={id} onClick={() => toggle(id)}>{displayName(person)} <span>×</span></button> : null; })}</div>
      <div className="member-picker-list">{loading ? <div className="modal-empty">Finding people…</div> : members.length === 0 ? <div className="modal-empty">No matching people.</div> : members.map((person) => { const selected = selectedIds.includes(person.id); return <button type="button" key={person.id} className={`member-picker-row ${selected ? 'selected' : ''}`} onClick={() => { if (mode === 'direct') setSelectedIds([person.id]); else toggle(person.id); }}><Avatar person={person} size="sm" /><span><strong>{displayName(person)}</strong><small>{person.email || 'Workspace member'}</small></span><i aria-hidden="true">{selected ? '✓' : ''}</i></button>; })}</div>
      <footer><span>{selectedIds.length ? `${selectedIds.length} ${selectedIds.length === 1 ? 'person' : 'people'} selected` : 'Select someone to continue'}</span><button type="button" className="messaging-primary-button" disabled={!valid || loading} onClick={onCreate}>{mode === 'direct' ? 'Open message' : 'Create group'}</button></footer>
    </section>
  </div>;
}

function InlineNetworkError({ message, onDismiss }) {
  if (!message) return null;
  return <div className="conversation-load-error network-inline-error" role="alert"><span>{message}</span><button type="button" onClick={onDismiss}>Dismiss</button></div>;
}

function NetworkDirectoryModal({ open, refreshKey, onClose, onViewProfile, onConnect, onMessage, busyId, error, onClearError }) {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    messagingMembersAPI.list({ query: query.trim() || undefined, limit: 24 })
      .then((response) => { if (!cancelled) setMembers(unwrapMembers(response)); })
      .catch(() => { if (!cancelled) setMembers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, query, refreshKey]);
  if (!open) return null;
  return <div className="network-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="network-directory" role="dialog" aria-modal="true" aria-labelledby="network-directory-title">
      <header><div><span className="modal-eyebrow">Tribes Capital</span><h2 id="network-directory-title">Find people</h2><p>Explore member profiles and grow your professional network.</p></div><button type="button" className="network-close" onClick={onClose} aria-label="Close people directory"><ActionIcon type="close" /></button></header>
      <label className="network-search"><Icon name="search" size={15} color="#667085" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" aria-label="Search members" /></label>
      <InlineNetworkError message={error} onDismiss={onClearError} />
      <div className="network-directory-list">
        {loading ? <p className="network-empty">Finding members…</p> : members.length === 0 ? <p className="network-empty">No members found.</p> : members.map((person) => <article className="network-directory-person" key={person.id}>
          <button type="button" className="network-person-main" onClick={() => onViewProfile(person)}><Avatar person={person} /><span><strong>{displayName(person)}</strong><small>{person.occupation || 'Tribes Capital member'}{person.presence === 'online' ? ' · Online' : ''}</small></span></button>
          <div className="network-directory-actions">
            <button type="button" className="network-secondary" onClick={() => onViewProfile(person)}>Profile</button>
            {person.connectionStatus === 'NONE' && <button type="button" className="network-primary" disabled={busyId === person.id} onClick={() => onConnect(person)}>{busyId === person.id ? 'Sending…' : 'Connect'}</button>}
            {person.connectionStatus === 'PENDING_SENT' && <button type="button" className="network-secondary" disabled>Pending</button>}
            {person.connectionStatus === 'PENDING_RECEIVED' && <button type="button" className="network-primary" onClick={() => onViewProfile(person)}>Respond</button>}
            {person.connectionStatus === 'CONNECTED' && <button type="button" className="network-secondary" disabled>Connected</button>}
            <button type="button" className="network-message" onClick={() => onMessage(person)}>Message</button>
          </div>
        </article>)}
      </div>
    </section>
  </div>;
}

function MemberProfileModal({ person, busy, error, onClearError, onClose, onConnect, onRespond, onMessage }) {
  if (!person) return null;
  const status = person.connectionStatus || 'NONE';
  const name = displayName(person);
  return <div className="network-backdrop network-profile-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="network-profile" role="dialog" aria-modal="true" aria-label={`${name} profile`}>
      <button type="button" className="network-close" onClick={onClose} aria-label="Close profile"><ActionIcon type="close" /></button>
      <div className="network-profile-heading"><Avatar person={person} /><div><h2>{name}</h2><p>{person.occupation || 'Tribes Capital member'}</p><small>{person.presence === 'online' ? 'Online now' : formatLastSeen(person.lastSeenAt)}</small></div></div>
      <InlineNetworkError message={error} onDismiss={onClearError} />
      <div className="network-profile-details">
        <section><h3>About</h3><p>{person.bio || 'This member has not added a bio yet.'}</p></section>
        {(person.school || person.department) && <section><h3>Background</h3><p>{[person.department, person.school].filter(Boolean).join(' · ')}</p></section>}
        {person.createdAt && <section><h3>Member since</h3><p>{new Date(person.createdAt).getFullYear()}</p></section>}
      </div>
      <footer className="network-profile-actions">
        {status === 'NONE' && <button type="button" className="network-primary" disabled={busy} onClick={() => onConnect(person)}>{busy ? 'Sending…' : 'Connect'}</button>}
        {status === 'PENDING_SENT' && <button type="button" className="network-secondary" disabled>Request sent</button>}
        {status === 'PENDING_RECEIVED' && <><button type="button" className="network-primary" disabled={busy} onClick={() => onRespond(person, 'ACCEPTED')}>Accept request</button><button type="button" className="network-secondary" disabled={busy} onClick={() => onRespond(person, 'DECLINED')}>Decline</button></>}
        {status === 'CONNECTED' && <button type="button" className="network-secondary" disabled>Connected</button>}
        <button type="button" className="network-message" onClick={() => onMessage(person)}>Message</button>
      </footer>
    </section>
  </div>;
}

function ConnectionRequestsModal({ requests, busy, userId, error, onClearError, onClose, onViewProfile, onRespond }) {
  const received = requests.received || [];
  const sent = requests.sent || [];
  const connections = requests.connections || [];
  const personFor = (request, key, status) => ({ ...request[key], connectionRequestId: request.id, connectionStatus: status });
  const connectionPerson = (request) => request.requesterId === userId ? request.recipient : request.requester;
  return <div className="network-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="network-requests" role="dialog" aria-modal="true" aria-labelledby="network-requests-title">
      <header><div><span className="modal-eyebrow">Your network</span><h2 id="network-requests-title">Connection requests</h2></div><button type="button" className="network-close" onClick={onClose} aria-label="Close requests"><ActionIcon type="close" /></button></header>
      <InlineNetworkError message={error} onDismiss={onClearError} />
      <div className="network-request-list">
        {received.length === 0 && sent.length === 0 && connections.length === 0 && <p className="network-empty">No connection requests or connections yet.</p>}
        {received.length > 0 && <section><h3>Received</h3>{received.map((request) => { const person = personFor(request, 'requester', 'PENDING_RECEIVED'); return <article className="network-request-row" key={request.id}><Avatar person={person} size="sm" /><button type="button" className="network-person-link" onClick={() => onViewProfile(person)}><strong>{displayName(person)}</strong><small>{person.occupation || 'Tribes Capital member'}</small></button><button type="button" className="network-primary" disabled={busy === request.id} onClick={() => onRespond(request.id, 'ACCEPTED', person)}>Accept</button><button type="button" className="network-secondary" disabled={busy === request.id} onClick={() => onRespond(request.id, 'DECLINED', person)}>Ignore</button></article>; })}</section>}
        {sent.length > 0 && <section><h3>Sent</h3>{sent.map((request) => { const person = personFor(request, 'recipient', 'PENDING_SENT'); return <button type="button" className="network-request-row network-sent-row" key={request.id} onClick={() => onViewProfile(person)}><Avatar person={person} size="sm" /><span className="network-person-link"><strong>{displayName(person)}</strong><small>{person.occupation || 'Request pending'}</small></span><span className="network-status-label">Pending</span></button>; })}</section>}
        {connections.length > 0 && <section><h3>Connected</h3>{connections.map((request) => { const person = { ...connectionPerson(request), connectionStatus: 'CONNECTED' }; return <button type="button" className="network-request-row network-sent-row" key={request.id} onClick={() => onViewProfile(person)}><Avatar person={person} size="sm" /><span className="network-person-link"><strong>{displayName(person)}</strong><small>{person.occupation || 'Connection'}</small></span><span className="network-status-label">Connected</span></button>; })}</section>}
      </div>
    </section>
  </div>;
}

export default function MessagingPage({ user, onViewProfile = () => {} }) {
  const [conversationLoadError, setConversationLoadError] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [messageSearchLoading, setMessageSearchLoading] = useState(false);
  const [conversations, setConversations] = useState([]); const [activeUsers, setActiveUsers] = useState([]); const [selectedId, setSelectedId] = useState(null); const [selectedPeer, setSelectedPeer] = useState(null); const [messages, setMessages] = useState([]); const [draft, setDraft] = useState(''); const [searchTerm, setSearchTerm] = useState(''); const [searchResults, setSearchResults] = useState([]); const [unread, setUnread] = useState([]); const [typingUsers, setTypingUsers] = useState(new Set()); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [connected, setConnected] = useState(false); const [pendingFile, setPendingFile] = useState(null); const [uploadProgress, setUploadProgress] = useState(null); const [replyingTo, setReplyingTo] = useState(null); const [editingMessage, setEditingMessage] = useState(null); const [mobileView, setMobileView] = useState('list'); const [conversationFilter, setConversationFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false); const [conversationMode, setConversationMode] = useState('direct'); const [memberQuery, setMemberQuery] = useState(''); const [directoryMembers, setDirectoryMembers] = useState([]); const [memberLoading, setMemberLoading] = useState(false); const [selectedMemberIds, setSelectedMemberIds] = useState([]); const [groupName, setGroupName] = useState(''); const [threadRoot, setThreadRoot] = useState(null); const [threadDraft, setThreadDraft] = useState(''); const [mentionQuery, setMentionQuery] = useState(null); const [mentionResults, setMentionResults] = useState([]); const [selectedMentions, setSelectedMentions] = useState([]); const [peopleSearchOpen, setPeopleSearchOpen] = useState(false); const [peopleSearchQuery, setPeopleSearchQuery] = useState(''); const [peopleSearchResults, setPeopleSearchResults] = useState([]); const [peopleSearchLoading, setPeopleSearchLoading] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false); const [requestsOpen, setRequestsOpen] = useState(false); const [selectedPerson, setSelectedPerson] = useState(null); const [connectionRequests, setConnectionRequests] = useState({ received: [], sent: [], connections: [] }); const [connectionBusy, setConnectionBusy] = useState(null); const [networkRefresh, setNetworkRefresh] = useState(0);
  const socketRef = useRef(null); const selectedIdRef = useRef(null); const typingTimers = useRef(new Map()); const messageEndRef = useRef(null); const threadEndRef = useRef(null); const fileInputRef = useRef(null); const composerRef = useRef(null); const dropZoneRef = useRef(null); const heartbeatRef = useRef(null);
  const selectedConversation = useMemo(() => conversations.find((conversation) => conversation.id === selectedId), [conversations, selectedId]); const unreadByConversation = useMemo(() => new Map(unread.map((item) => [item.conversationId, item.count || 0])), [unread]); const totalUnread = unread.reduce((total, item) => total + (item.count || 0), 0); const threadReplies = useMemo(() => threadRoot ? messages.filter((message) => message.replyToId === threadRoot.id) : [], [messages, threadRoot]);
  const visibleConversations = useMemo(() => conversations.filter((conversation) => { if (conversationFilter === 'unread') return (unreadByConversation.get(conversation.id) || 0) > 0; if (conversationFilter === 'channels') return conversation.type !== 'DIRECT'; return true; }), [conversationFilter, conversations, unreadByConversation]);
  const getConversationTitle = useCallback((conversation) => { if (!conversation) return 'Conversation'; if (conversation.type === 'DIRECT') { if (conversation.id === selectedId && selectedPeer) return displayName(selectedPeer); const peerMember = conversation.members?.find((member) => member.userId !== user?.id && member.user?.id !== user?.id); const peer = peerMember?.user || peerMember; const peerName = displayName(peer); return peerName !== 'Member' ? peerName : conversation.title || 'Direct message'; } return conversation.title || conversation.channel?.name || 'Conversation'; }, [selectedId, selectedPeer, user?.id]);
  const resolveDirectPeer = useCallback((conversation) => {
    if (!conversation || conversation.type !== 'DIRECT') return null;
    const member = conversation.members?.find((entry) => {
      const entryUserId = entry?.userId ?? entry?.user?.id;
      return entryUserId && String(entryUserId) !== String(user?.id);
    });
    return member?.user || member || selectedPeer || null;
  }, [selectedPeer, user?.id]);
  const openUserProfile = useCallback((person) => { if (!person?.id) return; setNetworkError(''); setNetworkOpen(false); setRequestsOpen(false); onViewProfile(person); }, [onViewProfile]);
  const refreshUnread = useCallback(async () => { try { setUnread(unwrap(await messagingAPI.unread()) || []); } catch {} }, []);
  const loadConversations = useCallback(async () => { try { const next = unwrap(await messagingAPI.listConversations()); const list = Array.isArray(next) ? next : []; setConversations(list); setSelectedId((current) => current || list[0]?.id || null); setConversationLoadError(false); } catch { setConversationLoadError(true); } finally { setLoading(false); } }, []);
  const retryLoadConversations = () => { setLoading(true); void loadConversations(); };
  const loadActiveUsers = useCallback(async () => { try { const next = unwrap(await messagingAPI.listActiveUsers()); setActiveUsers(Array.isArray(next) ? next : []); } catch {} }, []);
  const loadMessages = useCallback(async (conversationId) => { if (!conversationId) return; try { const next = unwrap(await messagingAPI.getMessages(conversationId)); const list = Array.isArray(next) ? next : []; setMessages(list); const incomingIds = list.filter((message) => message.senderId !== user?.id).map((message) => message.id); if (incomingIds.length) { await messagingAPI.markRead(incomingIds[incomingIds.length - 1], incomingIds); socketRef.current?.emit('message:read', { messageIds: incomingIds }); await refreshUnread(); } } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load messages.'); } }, [refreshUnread, user?.id]);
  const loadDirectory = useCallback(async (query = '') => { setMemberLoading(true); try { const response = await messagingMembersAPI.list({ query: query.trim() || undefined, limit: 50 }); setDirectoryMembers(unwrapMembers(response)); } catch { setDirectoryMembers([]); } finally { setMemberLoading(false); } }, []);
  const loadConnections = useCallback(async () => { try { const payload = unwrap(await communityAPI.listConnections()); setConnectionRequests(payload || { received: [], sent: [], connections: [] }); } catch { setConnectionRequests({ received: [], sent: [], connections: [] }); } }, []);
  useEffect(() => { void loadConnections(); }, [loadConnections]);
  useEffect(() => { void loadConversations(); void loadActiveUsers(); void refreshUnread(); }, [loadActiveUsers, loadConversations, refreshUnread]); useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { if (!modalOpen) return; void loadDirectory(memberQuery); }, [loadDirectory, modalOpen, memberQuery]);
  useEffect(() => {
    if (mentionQuery === null) { setMentionResults([]); return undefined; }
    let cancelled = false;
    messagingMembersAPI.list({ query: mentionQuery || undefined, limit: 8 }).then((response) => {
      if (!cancelled) setMentionResults(unwrapMembers(response));
    }).catch(() => { if (!cancelled) setMentionResults([]); });
    return () => { cancelled = true; };
  }, [mentionQuery]);
  useEffect(() => {
    if (!peopleSearchOpen || !peopleSearchQuery.trim()) { setPeopleSearchResults([]); return undefined; }
    let cancelled = false;
    setPeopleSearchLoading(true);
    messagingMembersAPI.list({ query: peopleSearchQuery.trim(), limit: 12 }).then((response) => {
      if (!cancelled) setPeopleSearchResults(unwrapMembers(response));
    }).catch(() => { if (!cancelled) setPeopleSearchResults([]); }).finally(() => { if (!cancelled) setPeopleSearchLoading(false); });
    return () => { cancelled = true; };
  }, [peopleSearchOpen, peopleSearchQuery]);
  useEffect(() => {
    const query = searchTerm.trim();
    if (!selectedId || query.length < 2) {
      setSearchResults([]);
      setMessageSearchLoading(false);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setMessageSearchLoading(true);
      messagingAPI.search(query, 25, selectedId)
        .then((response) => { if (!cancelled) setSearchResults(Array.isArray(unwrap(response)) ? unwrap(response) : []); })
        .catch(() => { if (!cancelled) setError('Unable to search messages in this conversation.'); })
        .finally(() => { if (!cancelled) setMessageSearchLoading(false); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [searchTerm, selectedId]);
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const socket = io(resolveSocketUrl(), {
      path: '/socket.io',
      auth: token ? { token } : undefined,
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('presence:heartbeat');
      if (selectedIdRef.current) socket.emit('conversation:join', { conversationId: selectedIdRef.current });
      heartbeatRef.current = window.setInterval(() => socket.emit('presence:heartbeat'), 20000);
      void loadActiveUsers();
      void loadConversations();
      if (selectedIdRef.current) void loadMessages(selectedIdRef.current);
    });
    socket.on('disconnect', () => { setConnected(false); if (heartbeatRef.current) window.clearInterval(heartbeatRef.current); });
    socket.on('connect_error', (error) => {
      console.error('Messaging socket connection error:', error);
      setConnected(false);
      void loadActiveUsers();
      void loadConversations();
    });
    socket.on('reconnect', () => {
      setConnected(true);
      socket.emit('presence:heartbeat');
      if (selectedIdRef.current) socket.emit('conversation:join', { conversationId: selectedIdRef.current });
      void loadActiveUsers();
      if (selectedIdRef.current) void loadMessages(selectedIdRef.current);
    });
    socket.on('user:online', () => void loadActiveUsers()); socket.on('user:offline', () => void loadActiveUsers());
    socket.on('notification:new', () => window.dispatchEvent(new CustomEvent('tribes:notifications-update', { detail: { type: 'notifications-updated' } })));
    socket.on('message:new', (message) => {
      if (message.senderId !== user?.id) window.dispatchEvent(new CustomEvent('tribes:notifications-update', { detail: { type: 'notifications-updated' } }));
      if (message.conversationId !== selectedIdRef.current) { if (message.senderId !== user?.id) void refreshUnread(); return; }
      setMessages((current) => {
        const existing = current.find((item) => item.id === message.id || item.tempId === message.id || (message.clientMessageId && item.clientMessageId === message.clientMessageId));
        if (existing) return current.map((item) => item.id === existing.id ? { ...message, tempId: item.tempId, clientMessageId: item.clientMessageId || message.clientMessageId } : item);
        return [...current, message];
      });
      if (message.senderId !== user?.id) void refreshUnread();
      void loadConversations();
    });
    socket.on('message:updated', (message) => setMessages((current) => current.map((item) => item.id === message.id ? { ...item, ...message } : item)));
    socket.on('message:deleted', ({ id }) => setMessages((current) => current.map((item) => item.id === id ? { ...item, isDeleted: true, content: '[deleted]' } : item)));
    socket.on('message:reaction', (event) => setMessages((current) => current.map((item) => item.id === event.messageId ? { ...item, reactions: event.reactions || [] } : item)));
    socket.on('message:read', ({ userId, messageIds }) => { if (userId === user?.id) return; setMessages((current) => current.map((item) => item.senderId === user?.id && messageIds.includes(item.id) ? { ...item, isRead: true } : item)); });
    socket.on('user:typing', ({ userId, conversationId }) => { if (!userId || userId === user?.id || conversationId !== selectedIdRef.current) return; setTypingUsers((current) => new Set([...current, userId])); clearTimeout(typingTimers.current.get(userId)); typingTimers.current.set(userId, setTimeout(() => setTypingUsers((current) => { const next = new Set(current); next.delete(userId); return next; }), 1800)); });
    socket.on('user:typing:stop', ({ userId, conversationId }) => { if (conversationId && conversationId !== selectedIdRef.current) return; clearTimeout(typingTimers.current.get(userId)); setTypingUsers((current) => { const next = new Set(current); next.delete(userId); return next; }); });
    return () => { if (heartbeatRef.current) window.clearInterval(heartbeatRef.current); typingTimers.current.forEach((timer) => clearTimeout(timer)); socket.disconnect(); socketRef.current = null; };
  }, [loadActiveUsers, loadConversations, loadMessages, refreshUnread, user?.id]);
  useEffect(() => { if (!selectedId) return; void loadMessages(selectedId); const socket = socketRef.current; if (socket?.connected) socket.emit('conversation:join', { conversationId: selectedId }); setReplyingTo(null); setEditingMessage(null); setThreadRoot(null); setThreadDraft(''); setMobileView('thread'); }, [loadMessages, selectedId]);
  useEffect(() => { if (!selectedId && !loading && window.innerWidth <= 720) setMobileView('thread'); }, [loading, selectedId]);
  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length]); useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [threadReplies.length]); useEffect(() => { if (composerRef.current) { composerRef.current.style.height = 'auto'; composerRef.current.style.height = `${Math.min(composerRef.current.scrollHeight, 140)}px`; } }, [draft]);
  const chooseConversation = (id) => { if (!id || id === selectedId) { if (id) setMobileView('thread'); return; } socketRef.current?.emit('conversation:leave', { conversationId: selectedId }); setSelectedPeer(null); setSearchTerm(''); setSearchResults([]); setSelectedId(id); };
  useEffect(() => {
    if (!selectedConversation || selectedConversation.type !== 'DIRECT') return;
    const peer = resolveDirectPeer(selectedConversation);
    if (peer?.id && (!selectedPeer || String(selectedPeer.id) !== String(peer.id))) setSelectedPeer(peer);
  }, [resolveDirectPeer, selectedConversation, selectedPeer]);
  const handleReconnect = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    try {
      if (socket.disconnected) socket.connect();
      setConnected(socket.connected);
    } catch {
      setConnected(false);
    }
  }, []);
  const closeModal = () => { setModalOpen(false); setMemberQuery(''); setSelectedMemberIds([]); setGroupName(''); };
  const createConversation = async () => { try { const payload = conversationMode === 'direct' ? { type: 'DIRECT', participantIds: selectedMemberIds } : { type: 'GROUP', participantIds: selectedMemberIds, title: groupName.trim() }; const conversation = unwrap(await messagingAPI.createConversation(payload)); setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]); setSelectedId(conversation.id); closeModal(); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to create conversation.'); } };
  const openNewConversation = (mode = 'direct') => { setConversationMode(mode); setSelectedMemberIds([]); setGroupName(''); setMemberQuery(''); setModalOpen(true); };
  const startDirectMessage = async (person) => { if (!person || person.id === user?.id) return; const hydrate = (conversation) => ({ ...conversation, title: conversation.title || displayName(person), members: Array.isArray(conversation.members) ? conversation.members.map((member) => member.userId === person.id && !member.user ? { ...member, user: person } : member) : conversation.members }); const existing = conversations.find((conversation) => conversation.type === 'DIRECT' && conversation.members?.some((member) => member.userId === person.id)); if (existing) { setConversations((current) => current.map((conversation) => conversation.id === existing.id ? hydrate(conversation) : conversation)); setSelectedPeer(person); setSelectedId(existing.id); setMobileView('thread'); return; } try { const conversation = hydrate(unwrap(await messagingAPI.createConversation({ type: 'DIRECT', participantIds: [person.id], title: displayName(person) }))); if (!conversation?.id) throw new Error('The conversation could not be opened.'); setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]); setSelectedPeer(person); setSelectedId(conversation.id); setMobileView('thread'); } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || 'Unable to start direct message.'); } };
  const updateConnectionStatus = (person, status, requestId = null) => {
    const updated = { ...person, connectionStatus: status, connectionRequestId: requestId };
    setSelectedPerson((current) => current?.id === person.id ? updated : current);
    setActiveUsers((current) => current.map((member) => member.id === person.id ? { ...member, ...updated } : member));
    setPeopleSearchResults((current) => current.map((member) => member.id === person.id ? { ...member, ...updated } : member));
    setNetworkRefresh((current) => current + 1);
  };
  const sendConnectionRequest = async (person) => {
    if (!person?.id) return;
    setConnectionBusy(person.id);
    try {
      const request = unwrap(await communityAPI.requestConnection(person.id));
      updateConnectionStatus(person, request?.status === 'ACCEPTED' ? 'CONNECTED' : 'PENDING_SENT', request?.id);
      await loadConnections();
    } catch (requestError) {
      setNetworkError(requestError.response?.data?.message || 'Unable to send this connection request.');
    } finally { setConnectionBusy(null); }
  };
  const respondToConnectionRequest = async (requestId, status, person) => {
    setConnectionBusy(requestId);
    try {
      await communityAPI.respondToConnectionRequest(requestId, status);
      updateConnectionStatus(person, status === 'ACCEPTED' ? 'CONNECTED' : 'NONE', null);
      await loadConnections();
    } catch (requestError) {
      setNetworkError(requestError.response?.data?.message || 'Unable to update this connection request.');
    } finally { setConnectionBusy(null); }
  };
  const messageProfile = (person) => { setSelectedPerson(null); setNetworkOpen(false); setRequestsOpen(false); void startDirectMessage(person); };
  const uploadFile = async (_conversationId, file) => { if (!file) return []; return [await uploadFileInChunks(file, 'messaging', setUploadProgress)]; };
  const sendMessage = async (event, explicitReplyTo = null, explicitContent = null, explicitFile = null) => {
    event?.preventDefault();
    const file = explicitFile || pendingFile; const content = explicitContent ?? draft.trim(); const conversationId = selectedId; const replyTarget = explicitReplyTo || replyingTo;
    if (!conversationId || (!content && !file) || editingMessage) return;
    const clientMessageId = `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const optimistic = { id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`, tempId: clientMessageId, clientMessageId, conversationId, senderId: user?.id, content: content || file?.name || '', draftContent: content, createdAt: new Date().toISOString(), isOptimistic: true, sender: user, attachments: file ? [{ id: `local-file-${Date.now()}`, fileName: file.name, mimeType: file.type, size: file.size, url: '#' }] : [], replyTo: replyTarget };
    setMessages((current) => [...current, optimistic]);
    if (!explicitReplyTo) { setDraft(''); setPendingFile(null); setReplyingTo(null); setSelectedMentions([]); setMentionQuery(null); }
    socketRef.current?.emit('typing:stop', { conversationId });
    try {
      const attachments = file ? await uploadFile(conversationId, file) : [];
      const mentions = selectedMentions.filter((mention) => content.includes(`@${mention.label}`)).map((mention) => mention.id);
      const payload = { content, attachments, mentions, replyToId: replyTarget?.id, clientMessageId };
      if (socketRef.current?.connected) {
        const response = await emitWithAck(socketRef.current, 'message:send', { conversationId, ...payload });
        const sent = response.message;
        setMessages((current) => current.map((item) => item.clientMessageId === clientMessageId || item.id === sent.id ? { ...sent, tempId: clientMessageId, clientMessageId } : item));
      } else {
        const sent = unwrap(await messagingAPI.sendMessage(conversationId, payload));
        setMessages((current) => current.map((item) => item.id === optimistic.id ? { ...sent, tempId: clientMessageId, clientMessageId } : item));
      }
    } catch (requestError) {
      setMessages((current) => current.map((item) => item.id === optimistic.id || item.clientMessageId === clientMessageId ? { ...item, isOptimistic: false, sendFailed: true, pendingFile: file } : item));
      setError(requestError.response?.data?.message || requestError.message || 'Unable to send message. Try again.');
    } finally {
      setUploadProgress(null);
    }
  };
  const sendThreadReply = async (event) => { event?.preventDefault(); const content = threadDraft.trim(); if (!threadRoot || !content) return; setThreadDraft(''); await sendMessage(null, threadRoot, content); };
  const submitEdit = (event) => { event?.preventDefault(); const content = draft.trim(); if (!editingMessage || !content) return; socketRef.current?.emit('message:edit', { messageId: editingMessage.id, content }); setMessages((current) => current.map((item) => item.id === editingMessage.id ? { ...item, content, isEdited: true } : item)); setEditingMessage(null); setDraft(''); };
  const deleteMessage = (message) => { if (!window.confirm('Delete this message?')) return; socketRef.current?.emit('message:delete', { messageId: message.id }); };
  const reactToMessage = async (messageId, reaction) => { try { if (socketRef.current?.connected) { await emitWithAck(socketRef.current, 'message:react', { messageId, reaction }); return; } const result = unwrap(await messagingAPI.toggleReaction(messageId, reaction)); if (result?.reactions) setMessages((current) => current.map((item) => item.id === messageId ? { ...item, reactions: result.reactions } : item)); } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || 'Unable to update reaction.'); } };
  const handleTyping = (event) => { const value = event.target.value; setDraft(value); const match = value.match(/(?:^|\s)@([^\s@]*)$/); setMentionQuery(match ? match[1] : null); if (!selectedId || !socketRef.current?.connected) return; socketRef.current.emit('typing:start', { conversationId: selectedId }); clearTimeout(typingTimers.current.get('self')); typingTimers.current.set('self', setTimeout(() => socketRef.current?.emit('typing:stop', { conversationId: selectedId }), 900)); };
  const selectMention = (person) => { const label = displayName(person); const match = draft.match(/(?:^|\s)@([^\s@]*)$/); if (!match) return; const start = match.index + match[0].lastIndexOf('@'); setDraft(`${draft.slice(0, start)}@${label} `); setSelectedMentions((current) => [...current.filter((mention) => mention.id !== person.id), { id: person.id, label }]); setMentionQuery(null); setMentionResults([]); composerRef.current?.focus(); };
  const handleComposerKeyDown = (event) => { if (event.key === 'Escape' && editingMessage) { setEditingMessage(null); setDraft(''); return; } if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (editingMessage) submitEdit(event); else void sendMessage(event); } };
  const acceptFile = (file) => { if (!file) return; if (file.size > 25 * 1024 * 1024) { setError('Attachments must be 25 MB or smaller.'); return; } setPendingFile(file); };
  const handlePaste = (event) => { const image = [...(event.clipboardData?.files || [])].find((file) => file.type.startsWith('image/')); if (image) { event.preventDefault(); acceptFile(image); } };
  const handleDrop = (event) => { event.preventDefault(); dropZoneRef.current?.classList.remove('dragging'); acceptFile(event.dataTransfer?.files?.[0]); };
  const safePeopleSearchResults = Array.isArray(peopleSearchResults) ? peopleSearchResults.filter((person) => person && typeof person === 'object' && person.id) : [];
  const safeMentionResults = Array.isArray(mentionResults) ? mentionResults.filter((person) => person && typeof person === 'object' && person.id) : [];
  const typingNames = [...typingUsers].map((id) => displayName(activeUsers.find((person) => person.id === id) || { id, displayName: 'Someone' }));
  return <main className="messaging-page">
    <header className="messaging-header"><div className="messaging-heading-copy"><div className="messaging-title-row"><span className="messaging-mark"><HugeiconsIcon icon={BubbleChatIcon} size={24} color="currentColor" strokeWidth={2} /></span><div><h1>Messages</h1><p>Focused conversations for teams, communities, and direct collaboration.</p></div></div></div><div className="messaging-header-actions"><div className="network-toolbar"><button type="button" onClick={() => { setNetworkError(''); setNetworkOpen(true); }}>Find people</button><button type="button" onClick={() => { setNetworkError(''); setRequestsOpen(true); }}>Invitations{connectionRequests.received?.length > 0 && <b>{connectionRequests.received.length}</b>}</button></div><button className="messaging-primary-button" type="button" onClick={() => openNewConversation('direct')}><Icon name="plus" size={15} color="#fff" /> New conversation</button></div></header>
    {error && !networkOpen && !requestsOpen && !selectedPerson && <div className="messaging-alert conversation-load-error" role="alert"><span><strong>Messaging error</strong><small>{error}</small></span><button type="button" onClick={() => setError('')}>Dismiss</button></div>}
    {conversationLoadError && !networkOpen && !requestsOpen && !selectedPerson && <div className="conversation-load-error" role="alert"><span><strong>Conversations couldn’t load</strong><small>Check your connection, then try again. Your existing messages are unchanged.</small></span><button type="button" onClick={retryLoadConversations} disabled={loading}>{loading ? 'Retrying…' : 'Try again'}</button></div>}
    <div className={`messaging-layout mobile-${mobileView}`}>
      <aside className="conversation-panel"><div className="conversation-heading"><div><span className="panel-title">Inbox</span><span className="panel-count">{conversations.length}</span></div><button className="rail-action" type="button" onClick={() => openNewConversation('direct')} aria-label="New conversation">+</button></div><div className="conversation-filters">{[['all', 'All'], ['unread', 'Unread'], ['channels', 'Groups']].map(([value, label]) => <button key={value} type="button" className={conversationFilter === value ? 'filter-active' : ''} onClick={() => setConversationFilter(value)}>{label}{value === 'unread' && totalUnread > 0 && <span>{totalUnread}</span>}</button>)}</div>
        <div className="conversation-list">{loading ? <div className="empty-state">Loading conversations…</div> : visibleConversations.length === 0 ? <div className="empty-state rail-empty"><strong>{conversationFilter === 'unread' ? 'You are all caught up' : 'No conversations yet'}</strong><span>Start a direct message or create a named group.</span><button type="button" className="empty-state-action" onClick={() => openNewConversation('direct')}>Start a conversation</button></div> : visibleConversations.map((conversation) => { const count = unreadByConversation.get(conversation.id) || 0; const lastMessage = conversation.messages?.[0]; const title = getConversationTitle(conversation); const peer = resolveDirectPeer(conversation); return <button key={conversation.id} type="button" className={`conversation-item ${selectedId === conversation.id ? 'selected' : ''}`} onClick={() => chooseConversation(conversation.id)}><span className="conversation-avatar">{peer?.avatar ? <img src={peer.avatar} alt="" /> : <InitialsAvatar person={{ displayName: title }} alt={`${title} conversation`} />}</span><span className="conversation-copy"><strong>{title}</strong><span>{lastMessage?.content || 'Start the conversation'}</span></span>{count > 0 && <span className="unread-badge">{count > 99 ? '99+' : count}</span>}</button>; })}</div>
        <div className="active-user-panel"><div className="people-panel-header"><div><span className="panel-title">People</span><span className="panel-count">{activeUsers.length}</span></div><div className="people-panel-actions"><span className="people-live-label"><i /> {activeUsers.length ? 'Online now' : 'No one online'}</span><button type="button" className="people-search-toggle" onClick={() => { setPeopleSearchOpen((open) => !open); setPeopleSearchQuery(''); }} aria-label="Search people" title="Search people"><Icon name="search" size={14} color="currentColor" /></button></div></div>{peopleSearchOpen && <div className="people-search-box"><Icon name="search" size={13} color="#667085" /><input autoFocus value={peopleSearchQuery} onChange={(event) => setPeopleSearchQuery(event.target.value)} placeholder="Search by name or username" aria-label="Search people by name or username" /><button type="button" onClick={() => { setPeopleSearchOpen(false); setPeopleSearchQuery(''); }} aria-label="Close people search">×</button></div>}{peopleSearchOpen && peopleSearchQuery.trim() && <div className="people-search-results">{peopleSearchLoading ? <span>Searching people…</span> : safePeopleSearchResults.length === 0 ? <span>No matching people.</span> : safePeopleSearchResults.map((person) => <button type="button" key={person.id} onClick={() => { void startDirectMessage(person); setPeopleSearchOpen(false); setPeopleSearchQuery(''); }}><Avatar person={person} size="sm" /><span><strong>{displayName(person)}</strong><small>{person?.email || 'Workspace member'}</small></span><b>Message</b></button>)}</div>}<div className="people-online-strip" aria-label="People online">{activeUsers.slice(0, 8).map((person) => { const name = person.id === user?.id ? 'You' : displayName(person); return <button className="people-online-avatar" key={person.id} type="button" onClick={() => void startDirectMessage(person)} title={name} aria-label={`Message ${name}`}><span className="people-avatar-wrap"><Avatar person={person} size="sm" /><i /></span><span className="people-online-name">{name}</span></button>; })}{activeUsers.length === 0 && <span className="people-empty-copy">Connected teammates will appear here.</span>}</div><div className="people-online-list">{activeUsers.slice(0, 5).map((person) => <button className="active-user-item" key={person.id} type="button" onClick={() => person.id !== user?.id && void startDirectMessage(person)}><span className="people-row-avatar"><Avatar person={person} size="sm" /><i /></span><span><strong>{person.id === user?.id ? 'You' : displayName(person)}</strong><small>{person.id === user?.id ? 'Your active session' : 'Available to message'}</small></span><span className="people-dm-hint">{person.id === user?.id ? 'Online' : 'DM'}</span></button>)}</div><button className="people-directory-link" type="button" onClick={() => openNewConversation('direct')}><span>Find someone in the workspace</span><span aria-hidden="true">→</span></button></div>
      </aside>
      <section className="thread-panel">{!selectedConversation ? <div className="thread-empty"><button type="button" className="mobile-back thread-empty-back" onClick={() => setMobileView('list')} aria-label="Back to inbox" title="Back to inbox">← Inbox</button><span className="empty-icon"><HugeiconsIcon icon={BubbleChatIcon} size={22} color="currentColor" strokeWidth={2} /></span><h2>{conversationLoadError ? 'Inbox unavailable' : 'Choose a conversation'}</h2><p>{conversationLoadError ? 'The conversation view is ready. Retry loading the inbox, or start a new conversation.' : 'Select a conversation from your inbox or start a new one.'}</p><button type="button" className="messaging-primary-button" onClick={() => openNewConversation('direct')}>Start a conversation</button></div> : <>
        <header className="thread-header"><button className="mobile-back" type="button" onClick={() => setMobileView('list')} aria-label="Back to conversations">←</button><Avatar person={selectedConversation.type === 'DIRECT' ? (resolveDirectPeer(selectedConversation) || { displayName: getConversationTitle(selectedConversation) }) : null} onClick={selectedConversation.type === 'DIRECT' ? () => openUserProfile(resolveDirectPeer(selectedConversation)) : undefined} /><div className="thread-header-copy"><h2>{getConversationTitle(selectedConversation)}</h2><p>{selectedConversation.type === 'DIRECT' ? 'Direct message' : `${selectedConversation.members?.length || 0} people · named group`} · {connected ? 'Live updates on' : 'Offline mode'}</p></div>{selectedConversation.type === 'DIRECT' && <button type="button" className="thread-view-profile" onClick={() => { const person = resolveDirectPeer(selectedConversation); if (person?.id) openUserProfile(person); }}>View profile</button>}<div className="thread-header-actions"><button type="button" title="Start a group conversation" onClick={() => openNewConversation('group')}>＋</button><button type="button" title="Conversation details">ⓘ</button></div></header>
        <div className="thread-message-search"><label><Icon name="search" size={15} color="#667085" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search messages in this conversation" aria-label="Search messages in this conversation" /></label>{searchTerm.trim().length >= 2 && <div className="thread-message-search-results" role="status">{messageSearchLoading ? <p>Searching this conversation…</p> : searchResults.length === 0 ? <p>No matching messages in this conversation.</p> : searchResults.map((result) => <button type="button" key={result.id} onClick={() => document.getElementById(`message-${result.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><span><strong>{displayName(result.sender)}</strong><small>{formatTime(result.createdAt)}</small></span><p>{result.content}</p></button>)}</div>}</div>
        <div className={`message-list ${threadRoot ? 'with-thread' : ''}`} ref={dropZoneRef} onDragOver={(event) => { event.preventDefault(); dropZoneRef.current?.classList.add('dragging'); }} onDragLeave={() => dropZoneRef.current?.classList.remove('dragging')} onDrop={handleDrop}>{messages.length === 0 ? <div className="thread-empty compact"><h3>No messages yet</h3><p>Start the conversation</p></div> : messages.map((message) => <MessageRow key={message.id || message.tempId} message={message} user={user} onReply={setThreadRoot} onReact={reactToMessage} onEdit={(item) => { setEditingMessage(item); setDraft(item.content || ''); setTimeout(() => composerRef.current?.focus(), 0); }} onDelete={deleteMessage} onRetry={(item) => void sendMessage(null, item.replyTo, item.draftContent ?? item.content, item.pendingFile)} onOpenProfile={openUserProfile} />)}{typingNames.length > 0 && <div className="typing-indicator"><span className="typing-dots"><i /><i /><i /></span>{typingNames.length === 1 ? `${typingNames[0]} is typing…` : `${typingNames.slice(0, 2).join(', ')} are typing…`}</div>}<div ref={messageEndRef} /></div>
        {replyingTo && <div className="composer-context"><span><strong>Replying to {displayName(replyingTo.sender)}</strong><small>{replyingTo.content || '[attachment]'}</small></span><button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">×</button></div>}{editingMessage && <div className="composer-context editing"><span><strong>Editing message</strong><small>Enter to save · Esc to cancel</small></span><button type="button" onClick={() => { setEditingMessage(null); setDraft(''); }} aria-label="Cancel edit">×</button></div>}{pendingFile && <div className="file-preview"><span>📎</span><strong>{pendingFile.name}</strong><small>{Math.max(1, Math.round(pendingFile.size / 1024))} KB</small><button type="button" onClick={() => setPendingFile(null)}>×</button></div>}{uploadProgress !== null && <div role="status" className="message-upload-progress">Uploading attachment: {uploadProgress.percent}%<progress value={uploadProgress.percent} max="100" /></div>}
        {mentionQuery !== null && safeMentionResults.length > 0 && <div className="mention-suggestions" role="listbox" aria-label="Mention a user">{safeMentionResults.map((person) => <button type="button" key={person.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectMention(person)}><Avatar person={person} size="sm" /><span><strong>{displayName(person)}</strong><small>{person?.email || 'Workspace member'}</small></span></button>)}</div>}
        <form className="message-composer" onSubmit={editingMessage ? submitEdit : sendMessage} onPaste={handlePaste}><button type="button" className="composer-tool" onClick={() => fileInputRef.current?.click()} aria-label="Attach a file" title="Attach a file">＋</button><input ref={fileInputRef} type="file" hidden onChange={(event) => acceptFile(event.target.files?.[0])} /><textarea ref={composerRef} value={draft} onChange={handleTyping} onKeyDown={handleComposerKeyDown} placeholder={editingMessage ? 'Edit your message…' : 'Write a message…'} rows={1} aria-label="Message" /><button type="button" className="composer-tool" onClick={() => setDraft((value) => `${value}${value ? ' ' : ''}👍`)} aria-label="Add emoji">☺</button><button type="submit" className="send-button" disabled={!draft.trim() && !pendingFile} aria-label={editingMessage ? 'Save message' : 'Send message'}>{editingMessage ? 'Save' : 'Send'}</button></form><div className="composer-hint">Enter to send · Shift + Enter for a new line · Reply opens a focused thread</div>
        {threadRoot && <aside className="thread-drawer"><header><div><span className="modal-eyebrow">Thread</span><h3>{threadReplies.length ? `${threadReplies.length} ${threadReplies.length === 1 ? 'reply' : 'replies'}` : 'Start a thread'}</h3></div><button type="button" className="icon-button" onClick={() => setThreadRoot(null)} aria-label="Close thread"><ActionIcon type="close" /></button></header><div className="thread-root"><Avatar person={threadRoot.sender} size="sm" /><div><strong>{displayName(threadRoot.sender)}</strong><p>{threadRoot.content || '[attachment]'}</p></div></div><div className="thread-replies">{threadReplies.map((reply) => <div className="thread-reply" key={reply.id}><Avatar person={reply.sender} size="sm" /><div><strong>{reply.senderId === user?.id ? 'You' : displayName(reply.sender)}</strong><p>{reply.content}</p><time>{formatTime(reply.createdAt)}</time></div></div>)}<div ref={threadEndRef} /></div><form className="thread-composer" onSubmit={sendThreadReply}><textarea value={threadDraft} onChange={(event) => setThreadDraft(event.target.value)} placeholder="Reply in thread…" rows={2} /><button type="submit" disabled={!threadDraft.trim()} aria-label="Send thread reply"><ActionIcon type="send" /></button></form></aside>}
      </>}</section>
    </div>
    <ConversationModal open={modalOpen} mode={conversationMode} setMode={setConversationMode} members={directoryMembers} query={memberQuery} setQuery={setMemberQuery} selectedIds={selectedMemberIds} setSelectedIds={setSelectedMemberIds} groupName={groupName} setGroupName={setGroupName} loading={memberLoading} onClose={closeModal} onCreate={createConversation} />
    <NetworkDirectoryModal open={networkOpen} refreshKey={networkRefresh} onClose={() => { setNetworkOpen(false); setNetworkError(''); }} onViewProfile={(person) => { setNetworkError(''); setSelectedPerson(person); }} onConnect={sendConnectionRequest} onMessage={messageProfile} busyId={connectionBusy} error={networkError} onClearError={() => setNetworkError('')} />
    <MemberProfileModal person={selectedPerson} busy={connectionBusy === selectedPerson?.id || connectionBusy === selectedPerson?.connectionRequestId} error={networkError} onClearError={() => setNetworkError('')} onClose={() => { setSelectedPerson(null); setNetworkError(''); }} onConnect={sendConnectionRequest} onRespond={(person, status) => respondToConnectionRequest(person.connectionRequestId, status, person)} onMessage={messageProfile} />
    {requestsOpen && <ConnectionRequestsModal requests={connectionRequests} busy={connectionBusy} userId={user?.id} error={networkError} onClearError={() => setNetworkError('')} onClose={() => { setRequestsOpen(false); setNetworkError(''); }} onViewProfile={(person) => { setNetworkError(''); setSelectedPerson(person); }} onRespond={respondToConnectionRequest} />}
  </main>;
}
const formatLastSeen = (value) => {
  if (!value) return 'Availability not shared';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Availability not shared';
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (elapsedMinutes < 1) return 'Active just now';
  if (elapsedMinutes < 60) return `Last seen ${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Last seen ${elapsedHours} hr ago`;
  return `Last seen ${Math.floor(elapsedHours / 24)} days ago`;
};
