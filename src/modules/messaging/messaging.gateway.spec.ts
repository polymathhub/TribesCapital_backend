import { MessagingGateway } from './messaging.gateway';

describe('MessagingGateway', () => {
  const messagingService = {
    ensureUserAccess: jest.fn().mockResolvedValue({ id: 'conversation-1' }),
    createMessage: jest.fn().mockResolvedValue({ id: 'message-1', conversationId: 'conversation-1' }),
    updateMessage: jest.fn().mockResolvedValue({ id: 'message-1', conversationId: 'conversation-1' }),
    deleteMessage: jest.fn().mockResolvedValue({ success: true, id: 'message-1' }),
    toggleReaction: jest.fn().mockResolvedValue({ messageId: 'message-1', userId: 'user-1', reaction: '👍', action: 'added', reactions: [] }),
    markMessagesRead: jest.fn().mockResolvedValue({ count: 1 }),
    trackUserOnline: jest.fn().mockResolvedValue({ firstSession: true }),
    trackUserOffline: jest.fn().mockResolvedValue({ lastSession: true }),
    trackUserHeartbeat: jest.fn().mockResolvedValue({ firstSession: false }),
    listActiveUsers: jest.fn().mockResolvedValue([{ id: 'user-1', presence: 'online' }]),
  };
  const prisma = {
    message: {
      findUnique: jest.fn().mockResolvedValue({ conversationId: 'conversation-1' }),
      findMany: jest.fn().mockResolvedValue([{ id: 'message-1', conversationId: 'conversation-1' }]),
    },
    conversationMember: {
      findMany: jest.fn().mockResolvedValue([{ userId: 'user-2' }]),
    },
  };
  const jwtTokenService = { verifyAccessToken: jest.fn() };
  const configService = { get: jest.fn().mockReturnValue('secret') };
  const makeGateway = () => {
    const gateway = new MessagingGateway(configService as any, prisma as any, messagingService as any, jwtTokenService as any);
    const emit = jest.fn();
    const room = jest.fn(() => ({ emit }));
    (gateway as any).server = { to: room, emit };
    return { gateway, emit, room };
  };
  beforeEach(() => jest.clearAllMocks());

  it('sends new messages to the conversation room and the recipient user room', async () => {
    const { gateway, room } = makeGateway();
    const result = await gateway.sendMessage({ data: { userId: 'user-1' } } as any, { conversationId: 'conversation-1', content: 'Hello', clientMessageId: 'client-1' });
    expect(room).toHaveBeenCalledWith('conversation:conversation-1');
    expect(room).toHaveBeenCalledWith('user:user-2');
    expect(result.message.clientMessageId).toBe('client-1');
    expect((gateway as any).server.emit).not.toHaveBeenCalledWith('message:new', expect.anything());
  });

  it('normalizes object reply payloads before creating a message', async () => {
    const { gateway } = makeGateway();
    await gateway.sendMessage({ data: { userId: 'user-1' } } as any, {
      conversationId: 'conversation-1', content: 'Reply', replyToId: { id: 'message-1' }, mentions: [], attachments: [],
    });
    expect(messagingService.createMessage).toHaveBeenCalledWith(expect.objectContaining({ replyToId: 'message-1' }));
  });

  it('uses the shared access-token verifier for websocket authentication', async () => {
    const { gateway, emit } = makeGateway();
    jwtTokenService.verifyAccessToken.mockResolvedValue({ sub: 'user-1' });
    await gateway.handleConnection({ id: 'socket-1', handshake: { auth: { token: 'token-1' } }, join: jest.fn(), disconnect: jest.fn() } as any);
    expect(jwtTokenService.verifyAccessToken).toHaveBeenCalledWith('token-1');
    expect(messagingService.trackUserOnline).toHaveBeenCalledWith('user-1', 'socket-1');
    expect(emit).toHaveBeenCalledWith('user:online', { userId: 'user-1' });
  });

  it('scopes edits to the message conversation', async () => {
    const { gateway, room } = makeGateway();
    await gateway.editMessage({ data: { userId: 'user-1' } } as any, { messageId: 'message-1', content: 'Updated' });
    expect(room).toHaveBeenCalledWith('conversation:conversation-1');
  });

  it('toggles reactions and broadcasts the authoritative reaction state', async () => {
    const { gateway, room } = makeGateway();
    const result = await gateway.reactToMessage({ data: { userId: 'user-1' } } as any, { messageId: 'message-1', reaction: '👍' });
    expect(messagingService.toggleReaction).toHaveBeenCalledWith('user-1', 'message-1', '👍');
    expect(result.action).toBe('added');
    expect(room).toHaveBeenCalledWith('conversation:conversation-1');
  });

  it('tracks presence per socket and only broadcasts offline after the final socket closes', async () => {
    const { gateway, emit } = makeGateway();
    jwtTokenService.verifyAccessToken.mockResolvedValue({ sub: 'user-1' });
    await gateway.handleConnection({ id: 'socket-1', handshake: { auth: { token: 'token-1' } }, join: jest.fn(), disconnect: jest.fn() } as any);
    expect(messagingService.trackUserOnline).toHaveBeenCalledWith('user-1', 'socket-1');
    await gateway.handleDisconnect({ id: 'socket-1', data: { userId: 'user-1' } } as any);
    expect(messagingService.trackUserOffline).toHaveBeenCalledWith('user-1', 'socket-1');
    expect(emit).toHaveBeenCalledWith('user:offline', { userId: 'user-1' });
  });

  it('accepts presence heartbeats and can restore a stale session', async () => {
    const { gateway, emit } = makeGateway();
    messagingService.trackUserHeartbeat.mockResolvedValueOnce({ firstSession: true });
    await expect(gateway.presenceHeartbeat({ id: 'socket-1', data: { userId: 'user-1' } } as any)).resolves.toEqual({ ok: true });
    expect(messagingService.trackUserHeartbeat).toHaveBeenCalledWith('user-1', 'socket-1');
    expect(emit).toHaveBeenCalledWith('user:online', { userId: 'user-1' });
  });

  it('groups read receipts by conversation before broadcasting', async () => {
    const { gateway, room } = makeGateway();
    await gateway.readMessages({ data: { userId: 'user-1' } } as any, { messageIds: ['message-1', 'message-1'] });
    expect(messagingService.markMessagesRead).toHaveBeenCalledWith('user-1', ['message-1']);
    expect(room).toHaveBeenCalledWith('conversation:conversation-1');
  });
});
