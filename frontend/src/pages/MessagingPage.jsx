import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { HugeiconsIcon } from '@hugeicons/react';
import { BubbleChatIcon } from '@hugeicons/core-free-icons';
import { messagingAPI } from '../api/endpoints';
import Icon from '../components/Icon';
import profilePlaceholderImage from '../assets/illustrations/Artist Woman (1).png';
import './messaging.css';

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];
const formatTime = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
const displayName = (person) => `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || 'Member';

function Avatar({ person, label = 'Member', size = 'md' }) {
  return (
    <span className={`message-avatar message-avatar-${size}`} title={displayName(person) || label}>
      <img src={person?.avatar || profilePlaceholderImage} alt={`${displayName(person) || label} profile`} onError={(event) => { event.currentTarget.src = profilePlaceholderImage; }} />
    </span>
  );
}

function MessageRow({ message, user, onReply, onEdit, onDelete, onReact }) {
  const mine = message.senderId === user?.id;
  const [menuOpen, setMenuOpen] = useState(false);
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const groupedReactions = reactions.reduce((groups, item) => {
    groups[item.reaction] = [...(groups[item.reaction] || []), item];
    return groups;
  }, {});

  return (
    <article className={`message-row ${mine ? 'mine' : ''}`}>
      <Avatar person={message.sender || (mine ? user : null)} />
      <div className="message-content-wrap">
        <div className="message-meta">
          <strong>{mine ? 'You' : displayName(message.sender)}</strong>
          <time>{formatTime(message.createdAt)}</time>
          {message.isEdited && <span className="message-edited">edited</span>}
        </div>
        {message.replyTo && (
          <button className="reply-context" type="button" onClick={() => onReply(message.replyTo)}>
            <span>Replying to {displayName(message.replyTo.sender)}</span>
            <strong>{message.replyTo.content || '[attachment]'}</strong>
          </button>
        )}
        <div className={`message-bubble ${message.isDeleted ? 'deleted' : ''}`}>
          <p>{message.content || (message.attachments?.length ? '' : '[empty message]')}</p>
          {message.attachments?.length > 0 && (
            <div className="message-attachments">
              {message.attachments.map((attachment) => (
                <a key={attachment.id || attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="attachment-card">
                  <span className="attachment-icon"><Icon name="file" size={16} /></span>
                  <span><strong>{attachment.fileName}</strong><small>{attachment.mimeType || 'Attachment'}</small></span>
                </a>
              ))}
            </div>
          )}
        </div>
        {Object.keys(groupedReactions).length > 0 && (
          <div className="reaction-list">
            {Object.entries(groupedReactions).map(([reaction, items]) => (
              <button key={reaction} type="button" className="reaction-chip" onClick={() => onReact(message.id, reaction)} title={`${items.length} reaction${items.length === 1 ? '' : 's'}`}>
                <span>{reaction}</span><small>{items.length}</small>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="message-actions">
        <button type="button" onClick={() => onReply(message)} aria-label="Reply" title="Reply">↩</button>
        <button type="button" onClick={() => onReact(message.id, '👍')} aria-label="React with thumbs up" title="React">👍</button>
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="More message actions" title="More">•••</button>
        {menuOpen && (
          <div className="message-menu">
            {mine && <button type="button" onClick={() => { setMenuOpen(false); onEdit(message); }}>Edit</button>}
            {mine && <button type="button" onClick={() => { setMenuOpen(false); onDelete(message); }}>Delete</button>}
            <button type="button" onClick={() => { setMenuOpen(false); navigator.clipboard?.writeText(message.content || ''); }}>Copy</button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function MessagingPage({ user }) {
  const [conversations, setConversations] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [unread, setUnread] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  const socketRef = useRef(null);
  const selectedIdRef = useRef(null);
  const typingTimers = useRef(new Map());
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const composerRef = useRef(null);

  const selectedConversation = useMemo(() => conversations.find((conversation) => conversation.id === selectedId), [conversations, selectedId]);
  const totalUnread = unread.reduce((total, item) => total + (item.count || 0), 0);

  const getConversationTitle = useCallback((conversation) => {
    if (!conversation) return 'Conversation';
    if (conversation.type === 'DIRECT') {
      const peer = conversation.members?.find((member) => member.userId !== user?.id)?.user;
      return displayName(peer) || 'Direct message';
    }
    return conversation.title || conversation.channel?.name || 'Community conversation';
  }, [user?.id]);

  const refreshUnread = useCallback(async () => {
    try { setUnread(unwrap(await messagingAPI.unread()) || []); } catch { /* non-blocking */ }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const next = unwrap(await messagingAPI.listConversations());
      const list = Array.isArray(next) ? next : [];
      setConversations(list);
      setSelectedId((current) => current || list[0]?.id || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load conversations.');
    } finally { setLoading(false); }
  }, []);

  const loadActiveUsers = useCallback(async () => {
    try {
      const next = unwrap(await messagingAPI.listActiveUsers());
      setActiveUsers(Array.isArray(next) ? next : []);
    } catch { /* presence is supplementary */ }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      const next = unwrap(await messagingAPI.getMessages(conversationId));
      const list = Array.isArray(next) ? next : [];
      setMessages(list);
      if (list.length) {
        await messagingAPI.markRead(list[list.length - 1].id, list.map((message) => message.id));
        await refreshUnread();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load messages.');
    }
  }, [refreshUnread]);

  useEffect(() => { void loadConversations(); void loadActiveUsers(); void refreshUnread(); }, [loadActiveUsers, loadConversations, refreshUnread]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const socket = io(window.location.origin, { path: '/socket.io', auth: token ? { token } : undefined, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('user:online', () => void loadActiveUsers());
    socket.on('user:offline', () => void loadActiveUsers());
    socket.on('message:new', (message) => {
      if (message.conversationId !== selectedIdRef.current) { if (message.senderId !== user?.id) void refreshUnread(); return; }
      setMessages((current) => {
        const existing = current.find((item) => item.id === message.id || item.tempId === message.id);
        if (existing) return current.map((item) => item.id === existing.id ? { ...message, tempId: item.tempId } : item);
        return [...current, message];
      });
      if (message.senderId !== user?.id) void refreshUnread();
      void loadConversations();
    });
    socket.on('message:updated', (message) => setMessages((current) => current.map((item) => item.id === message.id ? { ...item, ...message } : item)));
    socket.on('message:deleted', ({ id }) => setMessages((current) => current.map((item) => item.id === id ? { ...item, isDeleted: true, content: '[deleted]' } : item)));
    socket.on('message:reaction', (reaction) => setMessages((current) => current.map((item) => item.id === reaction.messageId ? { ...item, reactions: [...(item.reactions || []).filter((entry) => !(entry.userId === reaction.userId && entry.reaction === reaction.reaction)), reaction] } : item)));
    socket.on('message:read', ({ userId, messageIds }) => {
      if (userId !== user?.id) return;
      setMessages((current) => current.map((item) => messageIds.includes(item.id) ? { ...item, isRead: true } : item));
    });
    socket.on('user:typing', ({ userId }) => {
      if (!userId || userId === user?.id) return;
      setTypingUsers((current) => new Set([...current, userId]));
      clearTimeout(typingTimers.current.get(userId));
      typingTimers.current.set(userId, setTimeout(() => setTypingUsers((current) => { const next = new Set(current); next.delete(userId); return next; }), 1800));
    });
    socket.on('user:typing:stop', ({ userId }) => {
      clearTimeout(typingTimers.current.get(userId));
      setTypingUsers((current) => { const next = new Set(current); next.delete(userId); return next; });
    });
    return () => {
      typingTimers.current.forEach((timer) => clearTimeout(timer));
      socket.disconnect();
      socketRef.current = null;
    };
  }, [loadActiveUsers, loadConversations, refreshUnread, user?.id]);

  useEffect(() => {
    if (!selectedId) return;
    void loadMessages(selectedId);
    const socket = socketRef.current;
    if (socket?.connected) socket.emit('conversation:join', { conversationId: selectedId });
    setReplyingTo(null);
    setEditingMessage(null);
    setMobileView('thread');
  }, [loadMessages, selectedId]);

  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length]);

  const chooseConversation = (id) => {
    if (!id || id === selectedId) return;
    socketRef.current?.emit('conversation:leave', { conversationId: selectedId });
    setSelectedId(id);
  };

  const createConversation = async (type = 'COMMUNITY_CHANNEL', targetUser = null) => {
    try {
      const payload = type === 'DIRECT' ? { type: 'DIRECT', participantIds: [targetUser.id], title: displayName(targetUser) } : { type: 'COMMUNITY_CHANNEL', title: 'Community conversation', channelName: 'Community conversation', isPrivateChannel: false };
      const conversation = unwrap(await messagingAPI.createConversation(payload));
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
      setSelectedId(conversation.id);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to create conversation.'); }
  };

  const startDirectMessage = async (person) => {
    if (!person || person.id === user?.id) return;
    const existing = conversations.find((conversation) => conversation.type === 'DIRECT' && conversation.members?.some((member) => member.userId === person.id));
    if (existing) return chooseConversation(existing.id);
    await createConversation('DIRECT', person);
  };

  const sendMessage = async (event) => {
    event?.preventDefault();
    if (!selectedId || (!draft.trim() && !pendingFile) || editingMessage) return;
    const file = pendingFile;
    const content = draft.trim();
    const tempId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const optimistic = { id: tempId, tempId, conversationId: selectedId, senderId: user?.id, content: content || file?.name || '', createdAt: new Date().toISOString(), isOptimistic: true, sender: user, attachments: file ? [{ id: `${tempId}-file`, fileName: file.name, mimeType: file.type, size: file.size, url: '#' }] : [], replyTo: replyingTo };
    setMessages((current) => [...current, optimistic]);
    setDraft(''); setPendingFile(null); setReplyingTo(null);
    socketRef.current?.emit('typing:stop', { conversationId: selectedId });
    try {
      let attachments = [];
      if (file) { const formData = new FormData(); formData.append('file', file); attachments = [unwrap(await messagingAPI.uploadAttachment(selectedId, formData))]; }
      const payload = { content, attachments, replyToId: optimistic.replyTo?.id };
      if (socketRef.current?.connected) socketRef.current.emit('message:send', { conversationId: selectedId, ...payload });
      else { const sent = unwrap(await messagingAPI.sendMessage(selectedId, payload)); setMessages((current) => current.map((item) => item.id === tempId ? { ...sent, tempId } : item)); }
    } catch (requestError) {
      setMessages((current) => current.map((item) => item.id === tempId ? { ...item, isOptimistic: false, sendFailed: true } : item));
      setError(requestError.response?.data?.message || 'Unable to send message. Try again.');
    }
  };

  const submitEdit = (event) => {
    event?.preventDefault();
    const content = draft.trim();
    if (!editingMessage || !content) return;
    socketRef.current?.emit('message:edit', { messageId: editingMessage.id, content });
    setMessages((current) => current.map((item) => item.id === editingMessage.id ? { ...item, content, isEdited: true } : item));
    setEditingMessage(null); setDraft('');
  };

  const deleteMessage = (message) => {
    if (!window.confirm('Delete this message?')) return;
    socketRef.current?.emit('message:delete', { messageId: message.id });
  };
  const reactToMessage = (messageId, reaction) => socketRef.current?.emit('message:react', { messageId, reaction });

  const handleTyping = (event) => {
    const value = event.target.value; setDraft(value);
    if (!selectedId || !socketRef.current?.connected) return;
    socketRef.current.emit('typing:start', { conversationId: selectedId });
    clearTimeout(typingTimers.current.get('self'));
    typingTimers.current.set('self', setTimeout(() => socketRef.current?.emit('typing:stop', { conversationId: selectedId }), 900));
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Escape' && editingMessage) { setEditingMessage(null); setDraft(''); return; }
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (editingMessage) submitEdit(event); else void sendMessage(event); }
  };

  const handleSearch = async (event) => {
    const value = event.target.value; setSearchTerm(value);
    if (value.trim().length < 2) return setSearchResults([]);
    try { const results = unwrap(await messagingAPI.search(value)); setSearchResults(Array.isArray(results) ? results : []); } catch { setSearchResults([]); }
  };

  const typingNames = [...typingUsers].map((id) => activeUsers.find((person) => person.id === id)).filter(Boolean).map(displayName);

  return (
    <main className="messaging-page">
      <header className="messaging-header">
        <div className="messaging-heading-copy"><div className="messaging-title-row"><span className="messaging-mark"><HugeiconsIcon icon={BubbleChatIcon} size={24} color="currentColor" strokeWidth={1.8} /></span><div><h1>Messages</h1><p>Focused conversations for teams, communities, and direct collaboration.</p></div></div></div>
        <div className="messaging-header-actions"><span className={`workspace-status ${connected ? 'online' : ''}`}><i />{connected ? 'Live' : 'Reconnecting'}</span><button className="messaging-primary-button" type="button" onClick={() => void createConversation()}><Icon name="plus" size={15} color="#fff" /> New conversation</button></div>
      </header>
      {error && <div className="messaging-alert" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss">×</button></div>}
      <div className={`messaging-layout mobile-${mobileView}`}>
        <aside className="conversation-panel">
          <div className="conversation-heading"><div><span className="panel-title">Inbox</span><span className="panel-count">{conversations.length}</span></div><button className="rail-action" type="button" onClick={() => void createConversation()} aria-label="New conversation">+</button></div>
          <label className="search-wrap"><Icon name="search" size={14} color="#6B7280" /><input value={searchTerm} onChange={handleSearch} placeholder="Search messages" aria-label="Search messages" /></label>
          <div className="conversation-filters"><button type="button" className="filter-active">All</button><button type="button">Unread <span>{totalUnread}</span></button><button type="button">Channels</button></div>
          {searchResults.length > 0 && <div className="search-results">{searchResults.map((result) => <button type="button" key={result.id} onClick={() => { chooseConversation(result.conversation?.id); setSearchTerm(''); setSearchResults([]); }}><strong>{result.conversation?.title || 'Conversation'}</strong><span>{result.content}</span></button>)}</div>}
          <div className="conversation-list">
            {loading ? <div className="empty-state">Loading conversations…</div> : conversations.length === 0 ? <div className="empty-state rail-empty"><strong>No conversations yet</strong><span>Start a conversation to get the discussion moving.</span></div> : conversations.map((conversation) => { const count = unread.find((item) => item.conversationId === conversation.id)?.count || 0; const lastMessage = conversation.messages?.[0]; const title = getConversationTitle(conversation); return <button key={conversation.id} type="button" className={`conversation-item ${selectedId === conversation.id ? 'selected' : ''}`} onClick={() => chooseConversation(conversation.id)}><span className="conversation-avatar">{title.slice(0, 1).toUpperCase()}</span><span className="conversation-copy"><strong>{title}</strong><span>{lastMessage?.content || 'Start the conversation'}</span></span>{count > 0 && <span className="unread-badge">{count > 99 ? '99+' : count}</span>}</button>; })}
          </div>
          <div className="active-user-panel"><div className="conversation-heading"><div><span className="panel-title">People online</span><span className="panel-count">{activeUsers.length}</span></div></div>{activeUsers.slice(0, 6).map((person) => <button className="active-user-item" key={person.id} type="button" onClick={() => void startDirectMessage(person)}><Avatar person={person} size="sm" /><span><strong>{displayName(person)}</strong><small>Available now</small></span><i /></button>)}</div>
        </aside>
        <section className="thread-panel">
          {!selectedConversation ? <div className="thread-empty"><span className="empty-icon">✦</span><h2>Choose a conversation</h2><p>Select a conversation from your inbox or start a new one.</p></div> : <>
            <header className="thread-header"><button className="mobile-back" type="button" onClick={() => setMobileView('list')} aria-label="Back to conversations">←</button><Avatar person={selectedConversation.members?.find((member) => member.userId !== user?.id)?.user} /><div><h2>{getConversationTitle(selectedConversation)}</h2><p>{selectedConversation.type === 'DIRECT' ? 'Direct message' : 'Community conversation'} · {connected ? 'Live updates on' : 'Offline mode'}</p></div><div className="thread-header-actions"><button type="button" title="Search conversation">⌕</button><button type="button" title="Conversation details">ⓘ</button></div></header>
            <div className="message-list">
              {messages.length === 0 ? <div className="thread-empty compact"><h3>No messages yet</h3><p>Start the conversation with a clear, human message.</p></div> : messages.map((message) => <MessageRow key={message.id || message.tempId} message={message} user={user} onReply={setReplyingTo} onEdit={(item) => { setEditingMessage(item); setDraft(item.content || ''); setTimeout(() => composerRef.current?.focus(), 0); }} onDelete={deleteMessage} onReact={reactToMessage} />)}
              {typingNames.length > 0 && <div className="typing-indicator"><span className="typing-dots"><i /><i /><i /></span>{typingNames.length === 1 ? `${typingNames[0]} is typing…` : `${typingNames.slice(0, 2).join(', ')} are typing…`}</div>}
              <div ref={messageEndRef} />
            </div>
            {replyingTo && <div className="composer-context"><span><strong>Replying to {displayName(replyingTo.sender)}</strong><small>{replyingTo.content || '[attachment]'}</small></span><button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">×</button></div>}
            {editingMessage && <div className="composer-context editing"><span><strong>Editing message</strong><small>Enter to save · Esc to cancel</small></span><button type="button" onClick={() => { setEditingMessage(null); setDraft(''); }} aria-label="Cancel edit">×</button></div>}
            {pendingFile && <div className="file-preview"><span>📎</span><strong>{pendingFile.name}</strong><small>{Math.round(pendingFile.size / 1024)} KB</small><button type="button" onClick={() => setPendingFile(null)}>×</button></div>}
            <form className="message-composer" onSubmit={editingMessage ? submitEdit : sendMessage}>
              <button type="button" className="composer-tool" onClick={() => fileInputRef.current?.click()} aria-label="Attach a file" title="Attach a file">＋</button>
              <input ref={fileInputRef} type="file" hidden onChange={(event) => setPendingFile(event.target.files?.[0] || null)} />
              <textarea ref={composerRef} value={draft} onChange={handleTyping} onKeyDown={handleComposerKeyDown} placeholder={editingMessage ? 'Edit your message…' : 'Write a message…'} rows={1} aria-label="Message" />
              <button type="button" className="composer-tool" onClick={() => setDraft((value) => `${value}${value ? ' ' : ''}👍`)} aria-label="Add reaction">☺</button>
              <button type="submit" className="send-button" disabled={!draft.trim() && !pendingFile} aria-label={editingMessage ? 'Save message' : 'Send message'}>{editingMessage ? 'Save' : 'Send'}</button>
            </form>
            <div className="composer-hint">Enter to send · Shift + Enter for a new line</div>
          </>}
        </section>
      </div>
    </main>
  );
}
