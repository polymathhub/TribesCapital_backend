import { MessagingGateway } from './messaging.gateway';

describe('MessagingGateway', () => {
  const messagingService = {
    ensureUserAccess: jest.fn().mockResolvedValue({ id: 'conversation-1' }),
    createMessage: jest.fn().mockResolvedValue({ id: 'message-1', conversationId: 'conversation-1' }),
    updateMessage: jest.fn().mockResolvedValue({ id: 'message-1', conversationId: 'conversation-1' }),
    deleteMessage: jest.fn().mockResolvedValue({ success: true, id: 'message-1' }),
    addReaction: jest.fn().mockResolvedValue({ id: 'reaction-1', messageId: 'message-1', userId: 'user-1', reaction: '👍' }),
    markMessagesRead: jest.fn().mockResolvedValue({ count: 1 }),
    trackUserOnline: jest.fn(),
    trackUserOffline: jest.fn(),
  };

  const prisma = {
    message: {
      findUnique: jest.fn().mockResolvedValue({ conversationId: 'conversation-1' }),
      findMany: jest.fn().mockResolvedValue([{ id: 'message-1', conversationId: 'conversation-1' }]),
    },
  };

  const jwtService = { verifyAsync: jest.fn() };
  const configService = { get: jest.fn() };

  const makeGateway = () => {
    const gateway = new MessagingGateway(jwtService as any, configService as any, prisma as any, messagingService as any);
    const emit = jest.fn();
    const room = jest.fn(() => ({ emit }));
    (gateway as any).server = { to: room, emit };
    return { gateway, emit, room };
  };

  beforeEach(() => jest.clearAllMocks());

  it('sends new messages only to the conversation room', async () => {
    const { gateway, room } = makeGateway();
    const client = { data: { userId: 'user-1' } } as any;

    await gateway.sendMessage(client, { conversationId: 'conversation-1', content: 'Hello' });

    expect(room).toHaveBeenCalledWith('conversation:conversation-1');
    expect((gateway as any).server.emit).not.toHaveBeenCalledWith('message:new', expect.anything());
  });

  it('scopes edits to the message conversation', async () => {
    const { gateway, room } = makeGateway();
    const client = { data: { userId: 'user-1' } } as any;

    await gateway.editMessage(client, { messageId: 'message-1', content: 'Updated' });

    expect(room).toHaveBeenCalledWith('conversation:conversation-1');
  });

  it('groups read receipts by conversation before broadcasting', async () => {
    const { gateway, room } = makeGateway();
    const client = { data: { userId: 'user-1' } } as any;

    await gateway.readMessages(client, { messageIds: ['message-1', 'message-1'] });

    expect(messagingService.markMessagesRead).toHaveBeenCalledWith('user-1', ['message-1']);
    expect(room).toHaveBeenCalledWith('conversation:conversation-1');
  });
});
