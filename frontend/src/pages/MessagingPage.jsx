import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { HugeiconsIcon } from '@hugeicons/react';
import { BubbleChatIcon } from '@hugeicons/core-free-icons';
import { messagingAPI } from '../api/endpoints';
import Icon from '../components/Icon';
import profilePlaceholderImage from '../assets/illustrations/Artist Woman (1).png';
import './messaging.css';

const unwrap = (response) => response?.data?.data ?? response?.data ?? [];
const formatTime = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

function MessageAvatar({ message, user }) {
  const sender = message.sender || (message.senderId === user?.id ? user : null);
  const displayName = sender?.firstName || (message.senderId === user?.id ? 'You' : 'Member');

  return (
    <span className="message-avatar" title={displayName}>
      <img
        src={sender?.avatar || profilePlaceholderImage}
        alt={`${displayName} profile`}
        onError={(event) => { event.currentTarget.src = profilePlaceholderImage; }}
      />
    </span>
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
  const [typingUser, setTypingUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const messageEndRef = useRef(null);
  const typingTimer = useRef(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId),
    [conversations, selectedId],
  );

  const getConversationTitle = (conversation) => {
    if (!conversation) return 'Conversation';
    if (conversation.type === 'DIRECT') {
      const peer = conversation.members?.find((member) => member.userId !== user?.id)?.user;
      if (peer) {
        return `${peer.firstName || ''} ${peer.lastName || ''}`.trim() || 'Direct message';
      }
      return 'Direct message';
    }
    return conversation.title || `${conversation.type} conversation`;
  };

  const loadConversations = async () => {
    try {
      const response = await messagingAPI.listConversations();
      const next = unwrap(response);
      setConversations(Array.isArray(next) ? next : []);
      if (!selectedId && next?.[0]?.id) setSelectedId(next[0].id);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveUsers = async () => {
    try {
      const response = await messagingAPI.listActiveUsers();
      const next = unwrap(response);
      setActiveUsers(Array.isArray(next) ? next : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load active users.');
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) return;
    try {
      const response = await messagingAPI.getMessages(conversationId);
      const next = unwrap(response);
      setMessages(Array.isArray(next) ? next : []);
      const ids = (Array.isArray(next) ? next : []).map((message) => message.id);
      if (ids.length) await messagingAPI.markRead(ids[ids.length - 1], ids);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load messages.');
    }
  };

  useEffect(() => { void loadConversations(); void loadActiveUsers(); }, []);
  useEffect(() => { void loadMessages(selectedId); }, [selectedId]);
  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    let active = true;
    messagingAPI.unread().then((response) => {
      if (active) setUnread(unwrap(response) || []);
    }).catch(() => {});
    return () => { active = false; };
  }, [conversations.length]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const nextSocket = io(window.location.origin, {
      path: '/socket.io',
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
    });
    nextSocket.on('connect', () => {
      if (selectedId) nextSocket.emit('conversation:join', { conversationId: selectedId });
    });
    nextSocket.on('user:online', () => { void loadActiveUsers(); });
    nextSocket.on('user:offline', () => { void loadActiveUsers(); });
    nextSocket.on('message:new', (message) => {
      if (message.conversationId === selectedId) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      }
      void loadConversations();
    });
    nextSocket.on('message:updated', (message) => {
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, ...message } : item));
    });
    nextSocket.on('message:deleted', ({ id }) => {
      setMessages((current) => current.map((item) => item.id === id ? { ...item, isDeleted: true, content: '[deleted]' } : item));
    });
    nextSocket.on('user:typing', ({ userId }) => { if (userId !== user?.id) setTypingUser(userId); });
    nextSocket.on('user:typing:stop', () => setTypingUser(null));
    setSocket(nextSocket);
    return () => nextSocket.disconnect();
  }, [selectedId, user?.id]);

  const createConversation = async (type = 'COMMUNITY_CHANNEL', targetUser = null) => {
    try {
      const payload = type === 'DIRECT' && targetUser
        ? {
            type: 'DIRECT',
            participantIds: [targetUser.id],
            title: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || 'Direct message',
          }
        : {
            type: 'COMMUNITY_CHANNEL',
            title: 'Community conversation',
            channelName: 'Community conversation',
            isPrivateChannel: false,
          };

      const response = await messagingAPI.createConversation(payload);
      const conversation = unwrap(response);
      setConversations((current) => [conversation, ...current]);
      setSelectedId(conversation.id);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create conversation.');
    }
  };

  const startDirectMessage = async (targetUser) => {
    if (!targetUser || targetUser.id === user?.id) return;

    const existing = conversations.find((conversation) =>
      conversation.type === 'DIRECT'
      && conversation.members?.some((member) => member.userId === user?.id)
      && conversation.members?.some((member) => member.userId === targetUser.id),
    );

    if (existing) {
      setSelectedId(existing.id);
      return;
    }

    await createConversation('DIRECT', targetUser);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!selectedId || (!draft.trim() && !pendingFile)) return;
    try {
      let attachments = [];
      if (pendingFile) {
        const formData = new FormData();
        formData.append('file', pendingFile);
        attachments = [unwrap(await messagingAPI.uploadAttachment(selectedId, formData))];
      }
      const payload = { content: draft.trim() || pendingFile.name, attachments };
      if (socket?.connected) socket.emit('message:send', { conversationId: selectedId, ...payload });
      else {
        const response = await messagingAPI.sendMessage(selectedId, payload);
        setMessages((current) => [...current, unwrap(response)]);
      }
      setDraft('');
      setPendingFile(null);
      socket?.emit('typing:stop', { conversationId: selectedId });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send message.');
    }
  };

  const handleSearch = async (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value.trim().length < 2) { setSearchResults([]); return; }
    try { setSearchResults(unwrap(await messagingAPI.search(value))); } catch { setSearchResults([]); }
  };

  const handleTyping = (event) => {
    setDraft(event.target.value);
    if (!socket || !selectedId) return;
    socket.emit('typing:start', { conversationId: selectedId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing:stop', { conversationId: selectedId }), 900);
  };

  return (
    <main className="messaging-page">
      <header className="messaging-header">
        <div>
          <div className="messaging-title-row"><span className="messaging-mark"><HugeiconsIcon icon={BubbleChatIcon} size={28} color="#5B21B6" strokeWidth={1.8} /></span><h1>Live Messages</h1></div>
          <p className="messaging-subtitle">Real-time conversations across teams, communities, and direct messages.</p>
        </div>
        <div className="messaging-header-actions"><span className={`workspace-status ${socket?.connected ? 'online' : ''}`}><i />{socket?.connected ? 'Live now' : 'Offline'}</span><button className="messaging-primary-button" type="button" onClick={createConversation}><Icon name="plus" size={15} color="#FFFFFF" strokeWidth={2} /> New conversation</button></div>
      </header>

      {error && <div className="messaging-alert" role="alert"><span className="alert-icon"><Icon name="help" size={13} color="#9F1239" strokeWidth={2} /></span><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error"><Icon name="close" size={15} color="#9F1239" strokeWidth={2} /></button></div>}
      <div className="messaging-layout">
        <aside className="conversation-panel">
          <div className="conversation-heading"><div><span className="panel-title">Inbox</span><span className="panel-count">{conversations.length || 0}</span></div><button className="rail-action" type="button" onClick={createConversation} aria-label="Start new conversation" title="Start new conversation"><Icon name="plus" size={15} color="#5B21B6" strokeWidth={2} /></button></div>
          <label className="search-wrap"><span><Icon name="search" size={14} color="#6B7280" /></span><input className="messaging-input" value={searchTerm} onChange={handleSearch} placeholder="Search messages" aria-label="Search messages" /></label>
          <div className="conversation-filters"><button type="button" className="filter-active">All</button><button type="button">Unread <span>{unread.reduce((total, item) => total + item.count, 0) || 0}</span></button><button type="button">Channels</button></div>
          {searchResults.length > 0 && <div className="search-results">{searchResults.map((result) => <button type="button" key={result.id} onClick={() => { setSelectedId(result.conversation?.id); setSearchTerm(''); setSearchResults([]); }}><strong>{result.conversation?.title || 'Conversation'}</strong><span>{result.content}</span></button>)}</div>}
          <div className="active-user-panel">
            <div className="conversation-heading"><div><span className="panel-title">Active users</span><span className="panel-count">{activeUsers.length}</span></div></div>
            <div className="active-user-list">
              {activeUsers.length === 0 ? <div className="empty-state">No active users right now.</div> : activeUsers.map((person) => (
                <button key={person.id} type="button" className={`active-user-item ${person.isActive ? 'live' : ''}`} onClick={() => void startDirectMessage(person)}>
                  <span className="conversation-avatar"><img src={person.avatar || profilePlaceholderImage} alt={`${person.firstName || 'User'} profile`} onError={(event) => { event.currentTarget.src = profilePlaceholderImage; }} /></span>
                  <span className="conversation-copy"><strong>{`${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Active user'}</strong><span className="presence-row"><span className="presence-dot" />{person.isActive ? 'Available now' : 'Offline'}</span></span>
                </button>
              ))}
            </div>
          </div>
          <div className="conversation-list">
            {loading ? <div className="empty-state">Loading conversations...</div> : conversations.length === 0 ? <div className="empty-state rail-empty"><span className="empty-icon"><Icon name="message" size={17} color="#5B21B6" /></span><strong>No conversations yet</strong><span>Start a room to bring your team together.</span></div> : conversations.map((conversation) => {
              const lastMessage = conversation.messages?.[0];
              const count = unread.find((item) => item.conversationId === conversation.id)?.count;
              const title = getConversationTitle(conversation);
              const isLive = Boolean(count || conversation.type === 'DIRECT');
              return <button className={`conversation-item ${selectedId === conversation.id ? 'selected' : ''} ${isLive ? 'live' : ''}`} type="button" key={conversation.id} onClick={() => { setSelectedId(conversation.id); socket?.emit('conversation:join', { conversationId: conversation.id }); }}><span className="conversation-avatar">{title.slice(0, 1).toUpperCase()}</span><span className="conversation-copy"><strong>{title}</strong><span className="conversation-preview-row"><span>{lastMessage?.content || 'No messages yet'}</span>{isLive ? <span className="live-pill">Live</span> : null}</span></span>{count ? <span className="unread-badge">{count}</span> : null}</button>;
            })}
          </div>
        </aside>

        <section className="message-panel">
          {selectedConversation ? <>
            <div className="message-panel-header"><div className="thread-heading"><span className="thread-avatar">{getConversationTitle(selectedConversation).slice(0, 1).toUpperCase()}</span><div><h2>{getConversationTitle(selectedConversation)}</h2><p><span className="thread-live-dot" />{selectedConversation.type.replace('_', ' ').toLowerCase()} · {selectedConversation.members?.length || 0} members</p></div></div><div className="thread-actions"><button type="button" aria-label="Search this conversation" title="Search this conversation"><Icon name="search" size={15} color="#6B7280" /></button><button type="button" aria-label="Conversation details" title="Conversation details"><Icon name="list" size={15} color="#6B7280" /></button></div></div>
            <div className="message-list">
              {messages.length === 0 ? <div className="empty-state message-empty">Start the conversation.</div> : messages.map((message) => <div className={`message-row ${message.senderId === user?.id ? 'mine' : ''}`} key={message.id}><MessageAvatar message={message} user={user} /><article className={`message-bubble ${message.senderId === user?.id ? 'mine' : ''}`}><div className="message-meta"><strong>{message.sender?.firstName || (message.senderId === user?.id ? 'You' : 'Member')}</strong><time>{formatTime(message.createdAt)}</time></div><p>{message.content || (message.attachments?.length ? 'Shared an attachment' : '[No message content]')}</p>{message.attachments?.map((attachment) => <a className="attachment-link" href={attachment.url} key={attachment.id || attachment.storageKey} target="_blank" rel="noreferrer"><Icon name="file" size={13} color="#5B21B6" /> {attachment.fileName}</a>)}</article></div>)}
              {typingUser && <div className="typing-indicator">Someone is typing...</div>}
              <div ref={messageEndRef} />
            </div>
            <form className="composer" onSubmit={sendMessage}><label className="attach-button" title="Attach a file"><Icon name="file" size={16} color="#5B21B6" /><input type="file" onChange={(event) => setPendingFile(event.target.files?.[0] || null)} /></label><textarea value={draft} onChange={handleTyping} placeholder="Write a message..." rows={1} aria-label="Message" />{pendingFile && <span className="file-chip">{pendingFile.name}</span>}<span className="composer-hint">Enter to send</span><button className="send-button" type="submit" aria-label="Send message"><Icon name="arrow" size={17} color="#FFFFFF" strokeWidth={2} /></button></form>
          </> : <div className="empty-state message-empty"><span className="empty-orbit"><Icon name="message" size={25} color="#5B21B6" /></span><h2>Your conversations, in one place</h2><p>Choose a room from the left or start a new conversation with your community.</p><button className="messaging-primary-button" type="button" onClick={createConversation}><Icon name="plus" size={15} color="#FFFFFF" strokeWidth={2} /> Start a conversation</button></div>}
        </section>
      </div>
    </main>
  );
}
