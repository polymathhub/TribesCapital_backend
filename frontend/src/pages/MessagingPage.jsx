import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { HugeiconsIcon } from '@hugeicons/react';
import { BubbleChatIcon } from '@hugeicons/core-free-icons';
import { messagingAPI } from '../api/endpoints';
import { messagingMembersAPI } from '../api/messagingMembers';
import Icon from '../components/Icon';
import profilePlaceholderImage from '../assets/illustrations/Artist Woman (1).png';
import './messaging.css';
import './messaging-mobile.css';
import './messaging-people-polish.css';
import './messaging-advanced.css';

const EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '💯', '🙏'];
const unwrap = (response) => response?.data?.data ?? response?.data ?? [];
const displayName = (person) => {
  const source = person?.user || person?.profile || person;
  if (source?.displayName) return source.displayName;
  const fullName = `${source?.firstName || ''} ${source?.lastName || ''}`.trim();
  return fullName || source?.name || source?.email || person?.email || 'Member';
};
const formatTime = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
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

function Avatar({ person, size = 'md' }) {
  return <span className={`message-avatar message-avatar-${size}`} title={displayName(person)}><img src={person?.avatar || profilePlaceholderImage} alt={`${displayName(person)} profile`} onError={(event) => { event.currentTarget.src = profilePlaceholderImage; }} /></span>;
}

function ActionIcon({ type }) {
  const paths = {
    reply: <path d="M7 9.5 3.5 13 7 16.5M4 13h7.5a5.5 5.5 0 0 0 0-11H8" />,
    smile: <><circle cx="10" cy="10" r="7.5" /><path d="M7 9h.01M13 9h.01M6.8 12.2a4 4 0 0 0 6.4 0" /></>,
    more: <><circle cx="5" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" /></>,
    close: <><path d="m5 5 10 10M15 5 5 15" /></>,
    send: <path d="m3 3 14 7-14 7 3.5-7L3 3Zm3.5 7H17" />,
  };
  return <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function MessageRow({ message, user, onReply, onReact, onEdit, onDelete, onRetry }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const grouped = reactions.reduce((groups, item) => ({ ...groups, [item.reaction]: [...(groups[item.reaction] || []), item] }), {});
  const mine = message.senderId === user?.id;
  return <article className={`message-row ${mine ? 'mine' : ''} ${message.sendFailed ? 'send-failed' : ''}`}>
    <Avatar person={message.sender || (mine ? user : null)} />
    <div className="message-content-wrap">
      <div className="message-meta"><strong>{mine ? 'You' : displayName(message.sender)}</strong><time>{formatTime(message.createdAt)}</time>{message.isOptimistic && <span className="message-state">Sending…</span>}{message.sendFailed && <span className="message-state error">Not sent</span>}{message.isEdited && <span className="message-edited">edited</span>}</div>
      {message.replyTo && <button className="reply-context" type="button" onClick={() => onReply(message.replyTo)}><span>Replying to {displayName(message.replyTo.sender)}</span><strong>{message.replyTo.content || '[attachment]'}</strong></button>}
      <div className={`message-bubble ${message.isDeleted ? 'deleted' : ''}`}><p>{message.content || (message.attachments?.length ? '' : '[empty message]')}</p>{message.attachments?.length > 0 && <div className="message-attachments">{message.attachments.map((attachment) => <a key={attachment.id || attachment.url} href={attachment.url === '#' ? undefined : attachment.url} target="_blank" rel="noreferrer" className={`attachment-card ${attachment.url === '#' ? 'pending' : ''}`}><span className="attachment-icon"><Icon name="file" size={16} /></span><span><strong>{attachment.fileName}</strong><small>{attachment.mimeType || 'Attachment'}</small></span></a>)}</div>}</div>
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

export default function MessagingPage({ user }) {
  const [conversations, setConversations] = useState([]); const [activeUsers, setActiveUsers] = useState([]); const [selectedId, setSelectedId] = useState(null); const [messages, setMessages] = useState([]); const [draft, setDraft] = useState(''); const [searchTerm, setSearchTerm] = useState(''); const [searchResults, setSearchResults] = useState([]); const [unread, setUnread] = useState([]); const [typingUsers, setTypingUsers] = useState(new Set()); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [connected, setConnected] = useState(false); const [pendingFile, setPendingFile] = useState(null); const [replyingTo, setReplyingTo] = useState(null); const [editingMessage, setEditingMessage] = useState(null); const [mobileView, setMobileView] = useState('list'); const [conversationFilter, setConversationFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false); const [conversationMode, setConversationMode] = useState('direct'); const [memberQuery, setMemberQuery] = useState(''); const [directoryMembers, setDirectoryMembers] = useState([]); const [memberLoading, setMemberLoading] = useState(false); const [selectedMemberIds, setSelectedMemberIds] = useState([]); const [groupName, setGroupName] = useState(''); const [threadRoot, setThreadRoot] = useState(null); const [threadDraft, setThreadDraft] = useState('');
  const socketRef = useRef(null); const selectedIdRef = useRef(null); const typingTimers = useRef(new Map()); const messageEndRef = useRef(null); const threadEndRef = useRef(null); const fileInputRef = useRef(null); const composerRef = useRef(null); const dropZoneRef = useRef(null); const heartbeatRef = useRef(null);
  const selectedConversation = useMemo(() => conversations.find((conversation) => conversation.id === selectedId), [conversations, selectedId]); const unreadByConversation = useMemo(() => new Map(unread.map((item) => [item.conversationId, item.count || 0])), [unread]); const totalUnread = unread.reduce((total, item) => total + (item.count || 0), 0); const threadReplies = useMemo(() => threadRoot ? messages.filter((message) => message.replyToId === threadRoot.id) : [], [messages, threadRoot]);
  const visibleConversations = useMemo(() => conversations.filter((conversation) => { if (conversationFilter === 'unread') return (unreadByConversation.get(conversation.id) || 0) > 0; if (conversationFilter === 'channels') return conversation.type !== 'DIRECT'; return true; }), [conversationFilter, conversations, unreadByConversation]);
  const getConversationTitle = useCallback((conversation) => { if (!conversation) return 'Conversation'; if (conversation.type === 'DIRECT') { const peer = conversation.members?.find((member) => member.userId !== user?.id)?.user; return displayName(peer) || 'Direct message'; } return conversation.title || conversation.channel?.name || 'Conversation'; }, [user?.id]);
  const refreshUnread = useCallback(async () => { try { setUnread(unwrap(await messagingAPI.unread()) || []); } catch {} }, []);
  const loadConversations = useCallback(async () => { try { const next = unwrap(await messagingAPI.listConversations()); const list = Array.isArray(next) ? next : []; setConversations(list); setSelectedId((current) => current || list[0]?.id || null); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load conversations.'); } finally { setLoading(false); } }, []);
  const loadActiveUsers = useCallback(async () => { try { const next = unwrap(await messagingAPI.listActiveUsers()); setActiveUsers(Array.isArray(next) ? next : []); } catch {} }, []);
  const loadMessages = useCallback(async (conversationId) => { if (!conversationId) return; try { const next = unwrap(await messagingAPI.getMessages(conversationId)); const list = Array.isArray(next) ? next : []; setMessages(list); if (list.length) { await messagingAPI.markRead(list[list.length - 1].id, list.map((message) => message.id)); await refreshUnread(); } } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load messages.'); } }, [refreshUnread]);
  const loadDirectory = useCallback(async (query = '') => { setMemberLoading(true); try { const response = await messagingMembersAPI.list({ query: query.trim() || undefined, limit: 50 }); const data = response?.data?.data ?? response?.data ?? []; setDirectoryMembers(Array.isArray(data) ? data : []); } catch { setDirectoryMembers([]); } finally { setMemberLoading(false); } }, []);
  useEffect(() => { void loadConversations(); void loadActiveUsers(); void refreshUnread(); }, [loadActiveUsers, loadConversations, refreshUnread]); useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { if (!modalOpen) return; void loadDirectory(memberQuery); }, [loadDirectory, modalOpen, memberQuery]);
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
    socket.on('user:typing', ({ userId }) => { if (!userId || userId === user?.id) return; setTypingUsers((current) => new Set([...current, userId])); clearTimeout(typingTimers.current.get(userId)); typingTimers.current.set(userId, setTimeout(() => setTypingUsers((current) => { const next = new Set(current); next.delete(userId); return next; }), 1800)); });
    socket.on('user:typing:stop', ({ userId }) => { clearTimeout(typingTimers.current.get(userId)); setTypingUsers((current) => { const next = new Set(current); next.delete(userId); return next; }); });
    return () => { if (heartbeatRef.current) window.clearInterval(heartbeatRef.current); typingTimers.current.forEach((timer) => clearTimeout(timer)); socket.disconnect(); socketRef.current = null; };
  }, [loadActiveUsers, loadConversations, loadMessages, refreshUnread, user?.id]);
  useEffect(() => { if (!selectedId) return; void loadMessages(selectedId); const socket = socketRef.current; if (socket?.connected) socket.emit('conversation:join', { conversationId: selectedId }); setReplyingTo(null); setEditingMessage(null); setThreadRoot(null); setThreadDraft(''); setMobileView('thread'); }, [loadMessages, selectedId]);
  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length]); useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [threadReplies.length]); useEffect(() => { if (composerRef.current) { composerRef.current.style.height = 'auto'; composerRef.current.style.height = `${Math.min(composerRef.current.scrollHeight, 140)}px`; } }, [draft]);
  const chooseConversation = (id) => { if (!id || id === selectedId) { if (id) setMobileView('thread'); return; } socketRef.current?.emit('conversation:leave', { conversationId: selectedId }); setSelectedId(id); };
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
  const startDirectMessage = async (person) => { if (!person || person.id === user?.id) return; const existing = conversations.find((conversation) => conversation.type === 'DIRECT' && conversation.members?.some((member) => member.userId === person.id)); if (existing) { setSelectedId(existing.id); setMobileView('thread'); return; } try { const conversation = unwrap(await messagingAPI.createConversation({ type: 'DIRECT', participantIds: [person.id], title: displayName(person) })); setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]); setSelectedId(conversation.id); setMobileView('thread'); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to start direct message.'); } };
  const uploadFile = async (conversationId, file) => { if (!file) return []; const formData = new FormData(); formData.append('file', file); return [unwrap(await messagingAPI.uploadAttachment(conversationId, formData))]; };
  const sendMessage = async (event, explicitReplyTo = null, explicitContent = null, explicitFile = null) => {
    event?.preventDefault();
    const file = explicitFile || pendingFile; const content = explicitContent ?? draft.trim(); const conversationId = selectedId; const replyTarget = explicitReplyTo || replyingTo;
    if (!conversationId || (!content && !file) || editingMessage) return;
    const clientMessageId = `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const optimistic = { id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`, tempId: clientMessageId, clientMessageId, conversationId, senderId: user?.id, content: content || file?.name || '', draftContent: content, createdAt: new Date().toISOString(), isOptimistic: true, sender: user, attachments: file ? [{ id: `local-file-${Date.now()}`, fileName: file.name, mimeType: file.type, size: file.size, url: '#' }] : [], replyTo: replyTarget };
    setMessages((current) => [...current, optimistic]);
    if (!explicitReplyTo) { setDraft(''); setPendingFile(null); setReplyingTo(null); }
    socketRef.current?.emit('typing:stop', { conversationId });
    try {
      const attachments = file ? await uploadFile(conversationId, file) : [];
      const payload = { content, attachments, replyToId: replyTarget?.id, clientMessageId };
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
    }
  };
  const sendThreadReply = async (event) => { event?.preventDefault(); const content = threadDraft.trim(); if (!threadRoot || !content) return; setThreadDraft(''); await sendMessage(null, threadRoot, content); };
  const submitEdit = (event) => { event?.preventDefault(); const content = draft.trim(); if (!editingMessage || !content) return; socketRef.current?.emit('message:edit', { messageId: editingMessage.id, content }); setMessages((current) => current.map((item) => item.id === editingMessage.id ? { ...item, content, isEdited: true } : item)); setEditingMessage(null); setDraft(''); };
  const deleteMessage = (message) => { if (!window.confirm('Delete this message?')) return; socketRef.current?.emit('message:delete', { messageId: message.id }); };
  const reactToMessage = async (messageId, reaction) => { try { if (socketRef.current?.connected) { await emitWithAck(socketRef.current, 'message:react', { messageId, reaction }); return; } const result = unwrap(await messagingAPI.toggleReaction(messageId, reaction)); if (result?.reactions) setMessages((current) => current.map((item) => item.id === messageId ? { ...item, reactions: result.reactions } : item)); } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || 'Unable to update reaction.'); } };
  const handleTyping = (event) => { const value = event.target.value; setDraft(value); if (!selectedId || !socketRef.current?.connected) return; socketRef.current.emit('typing:start', { conversationId: selectedId }); clearTimeout(typingTimers.current.get('self')); typingTimers.current.set('self', setTimeout(() => socketRef.current?.emit('typing:stop', { conversationId: selectedId }), 900)); };
  const handleComposerKeyDown = (event) => { if (event.key === 'Escape' && editingMessage) { setEditingMessage(null); setDraft(''); return; } if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (editingMessage) submitEdit(event); else void sendMessage(event); } };
  const acceptFile = (file) => { if (!file) return; if (file.size > 25 * 1024 * 1024) { setError('Attachments must be 25 MB or smaller.'); return; } setPendingFile(file); };
  const handlePaste = (event) => { const image = [...(event.clipboardData?.files || [])].find((file) => file.type.startsWith('image/')); if (image) { event.preventDefault(); acceptFile(image); } };
  const handleDrop = (event) => { event.preventDefault(); dropZoneRef.current?.classList.remove('dragging'); acceptFile(event.dataTransfer?.files?.[0]); };
  const handleSearch = async (event) => { const value = event.target.value; setSearchTerm(value); if (value.trim().length < 2) return setSearchResults([]); try { const results = unwrap(await messagingAPI.search(value)); setSearchResults(Array.isArray(results) ? results : []); } catch { setSearchResults([]); } };
  const typingNames = [...typingUsers].map((id) => activeUsers.find((person) => person.id === id)).filter(Boolean).map(displayName);
  return <main className="messaging-page">
    <header className="messaging-header"><div className="messaging-heading-copy"><div className="messaging-title-row"><span className="messaging-mark"><HugeiconsIcon icon={BubbleChatIcon} size={24} color="currentColor" strokeWidth={1.8} /></span><div><h1>Messages</h1><p>Focused conversations for teams, communities, and direct collaboration.</p></div></div></div><div className="messaging-header-actions"><button className="messaging-primary-button" type="button" onClick={() => openNewConversation('direct')}><Icon name="plus" size={15} color="#fff" /> New conversation</button></div></header>
    {error && <div className="messaging-alert" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss">×</button></div>}
    <div className={`messaging-layout mobile-${mobileView}`}>
      <aside className="conversation-panel"><div className="conversation-heading"><div><span className="panel-title">Inbox</span><span className="panel-count">{conversations.length}</span></div><button className="rail-action" type="button" onClick={() => openNewConversation('direct')} aria-label="New conversation">+</button></div><label className="search-wrap"><Icon name="search" size={14} color="#6B7280" /><input value={searchTerm} onChange={handleSearch} placeholder="Search messages" aria-label="Search messages" /></label><div className="conversation-filters">{[['all', 'All'], ['unread', 'Unread'], ['channels', 'Groups']].map(([value, label]) => <button key={value} type="button" className={conversationFilter === value ? 'filter-active' : ''} onClick={() => setConversationFilter(value)}>{label}{value === 'unread' && totalUnread > 0 && <span>{totalUnread}</span>}</button>)}</div>
        {searchResults.length > 0 && <div className="search-results">{searchResults.map((result) => <button type="button" key={result.id} onClick={() => { chooseConversation(result.conversation?.id); setSearchTerm(''); setSearchResults([]); }}><strong>{result.conversation?.title || 'Conversation'}</strong><span>{result.content}</span></button>)}</div>}
        <div className="conversation-list">{loading ? <div className="empty-state">Loading conversations…</div> : visibleConversations.length === 0 ? <div className="empty-state rail-empty"><strong>{conversationFilter === 'unread' ? 'You are all caught up' : 'No conversations yet'}</strong><span>Start a direct message or create a named group.</span><button type="button" className="empty-state-action" onClick={() => openNewConversation('direct')}>Start a conversation</button></div> : visibleConversations.map((conversation) => { const count = unreadByConversation.get(conversation.id) || 0; const lastMessage = conversation.messages?.[0]; const title = getConversationTitle(conversation); return <button key={conversation.id} type="button" className={`conversation-item ${selectedId === conversation.id ? 'selected' : ''}`} onClick={() => chooseConversation(conversation.id)}><span className="conversation-avatar">{title.slice(0, 1).toUpperCase()}</span><span className="conversation-copy"><strong>{title}</strong><span>{lastMessage?.content || 'Start the conversation'}</span></span>{count > 0 && <span className="unread-badge">{count > 99 ? '99+' : count}</span>}</button>; })}</div>
        <div className="active-user-panel"><div className="people-panel-header"><div><span className="panel-title">People</span><span className="panel-count">{activeUsers.length}</span></div><span className="people-live-label"><i /> {activeUsers.length ? 'Online now' : 'No one online'}</span></div><div className="people-online-strip" aria-label="People online">{activeUsers.slice(0, 8).map((person) => { const name = person.id === user?.id ? 'You' : displayName(person); return <button className="people-online-avatar" key={person.id} type="button" onClick={() => void startDirectMessage(person)} title={name} aria-label={`Message ${name}`}><span className="people-avatar-wrap"><Avatar person={person} size="sm" /><i /></span><span className="people-online-name">{name}</span></button>; })}{activeUsers.length === 0 && <span className="people-empty-copy">Connected teammates will appear here.</span>}</div><div className="people-online-list">{activeUsers.slice(0, 5).map((person) => <button className="active-user-item" key={person.id} type="button" onClick={() => person.id !== user?.id && void startDirectMessage(person)}><span className="people-row-avatar"><Avatar person={person} size="sm" /><i /></span><span><strong>{person.id === user?.id ? 'You' : displayName(person)}</strong><small>{person.id === user?.id ? 'Your active session' : 'Available to message'}</small></span><span className="people-dm-hint">{person.id === user?.id ? 'Online' : 'DM'}</span></button>)}</div><button className="people-directory-link" type="button" onClick={() => openNewConversation('direct')}><span>Find someone in the workspace</span><span aria-hidden="true">→</span></button></div>
      </aside>
      <section className="thread-panel">{!selectedConversation ? <div className="thread-empty"><span className="empty-icon"><HugeiconsIcon icon={BubbleChatIcon} size={22} color="currentColor" strokeWidth={1.8} /></span><h2>Choose a conversation</h2><p>Select a conversation from your inbox or start a new one.</p><button type="button" className="messaging-primary-button" onClick={() => openNewConversation('direct')}>Start a conversation</button></div> : <>
        <header className="thread-header"><button className="mobile-back" type="button" onClick={() => setMobileView('list')} aria-label="Back to conversations">←</button><Avatar person={selectedConversation.type === 'DIRECT' ? selectedConversation.members?.find((member) => member.userId !== user?.id)?.user : null} /><div className="thread-header-copy"><h2>{getConversationTitle(selectedConversation)}</h2><p>{selectedConversation.type === 'DIRECT' ? 'Direct message' : `${selectedConversation.members?.length || 0} people · named group`} · {connected ? 'Live updates on' : 'Offline mode'}</p></div><div className="thread-header-actions"><button type="button" title="Start a group conversation" onClick={() => openNewConversation('group')}>＋</button><button type="button" title="Conversation details">ⓘ</button></div></header>
        <div className={`message-list ${threadRoot ? 'with-thread' : ''}`} ref={dropZoneRef} onDragOver={(event) => { event.preventDefault(); dropZoneRef.current?.classList.add('dragging'); }} onDragLeave={() => dropZoneRef.current?.classList.remove('dragging')} onDrop={handleDrop}>{messages.length === 0 ? <div className="thread-empty compact"><h3>No messages yet</h3><p>Start the conversation with a clear, human message.</p></div> : messages.map((message) => <MessageRow key={message.id || message.tempId} message={message} user={user} onReply={setThreadRoot} onReact={reactToMessage} onEdit={(item) => { setEditingMessage(item); setDraft(item.content || ''); setTimeout(() => composerRef.current?.focus(), 0); }} onDelete={deleteMessage} onRetry={(item) => void sendMessage(null, item.replyTo, item.draftContent ?? item.content, item.pendingFile)} />)}{typingNames.length > 0 && <div className="typing-indicator"><span className="typing-dots"><i /><i /><i /></span>{typingNames.length === 1 ? `${typingNames[0]} is typing…` : `${typingNames.slice(0, 2).join(', ')} are typing…`}</div>}<div ref={messageEndRef} /></div>
        {replyingTo && <div className="composer-context"><span><strong>Replying to {displayName(replyingTo.sender)}</strong><small>{replyingTo.content || '[attachment]'}</small></span><button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">×</button></div>}{editingMessage && <div className="composer-context editing"><span><strong>Editing message</strong><small>Enter to save · Esc to cancel</small></span><button type="button" onClick={() => { setEditingMessage(null); setDraft(''); }} aria-label="Cancel edit">×</button></div>}{pendingFile && <div className="file-preview"><span>📎</span><strong>{pendingFile.name}</strong><small>{Math.max(1, Math.round(pendingFile.size / 1024))} KB</small><button type="button" onClick={() => setPendingFile(null)}>×</button></div>}
        <form className="message-composer" onSubmit={editingMessage ? submitEdit : sendMessage} onPaste={handlePaste}><button type="button" className="composer-tool" onClick={() => fileInputRef.current?.click()} aria-label="Attach a file" title="Attach a file">＋</button><input ref={fileInputRef} type="file" hidden onChange={(event) => acceptFile(event.target.files?.[0])} /><textarea ref={composerRef} value={draft} onChange={handleTyping} onKeyDown={handleComposerKeyDown} placeholder={editingMessage ? 'Edit your message…' : 'Write a message…'} rows={1} aria-label="Message" /><button type="button" className="composer-tool" onClick={() => setDraft((value) => `${value}${value ? ' ' : ''}👍`)} aria-label="Add emoji">☺</button><button type="submit" className="send-button" disabled={!draft.trim() && !pendingFile} aria-label={editingMessage ? 'Save message' : 'Send message'}>{editingMessage ? 'Save' : 'Send'}</button></form><div className="composer-hint">Enter to send · Shift + Enter for a new line · Reply opens a focused thread</div>
        {threadRoot && <aside className="thread-drawer"><header><div><span className="modal-eyebrow">Thread</span><h3>{threadReplies.length ? `${threadReplies.length} ${threadReplies.length === 1 ? 'reply' : 'replies'}` : 'Start a thread'}</h3></div><button type="button" className="icon-button" onClick={() => setThreadRoot(null)} aria-label="Close thread"><ActionIcon type="close" /></button></header><div className="thread-root"><Avatar person={threadRoot.sender} size="sm" /><div><strong>{displayName(threadRoot.sender)}</strong><p>{threadRoot.content || '[attachment]'}</p></div></div><div className="thread-replies">{threadReplies.map((reply) => <div className="thread-reply" key={reply.id}><Avatar person={reply.sender} size="sm" /><div><strong>{reply.senderId === user?.id ? 'You' : displayName(reply.sender)}</strong><p>{reply.content}</p><time>{formatTime(reply.createdAt)}</time></div></div>)}<div ref={threadEndRef} /></div><form className="thread-composer" onSubmit={sendThreadReply}><textarea value={threadDraft} onChange={(event) => setThreadDraft(event.target.value)} placeholder="Reply in thread…" rows={2} /><button type="submit" disabled={!threadDraft.trim()} aria-label="Send thread reply"><ActionIcon type="send" /></button></form></aside>}
      </>}</section>
    </div>
    <ConversationModal open={modalOpen} mode={conversationMode} setMode={setConversationMode} members={directoryMembers} query={memberQuery} setQuery={setMemberQuery} selectedIds={selectedMemberIds} setSelectedIds={setSelectedMemberIds} groupName={groupName} setGroupName={setGroupName} loading={memberLoading} onClose={closeModal} onCreate={createConversation} />
  </main>;
}
