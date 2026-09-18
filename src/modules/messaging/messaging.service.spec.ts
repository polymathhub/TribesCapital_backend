import { Test } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../../database/prisma.service';

describe('MessagingService', () => {
  let service: MessagingService;
  const prisma = {
    $transaction: jest.fn(async (callback: (tx: any) => unknown) => callback(prisma)),
    $executeRaw: jest.fn().mockResolvedValue(0),
    conversation: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    conversationMember: { createMany: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    message: { findMany: jest.fn(), create: jest.fn(), count: jest.fn(), groupBy: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    messageRead: { findMany: jest.fn(), createMany: jest.fn() },
    messageReaction: { upsert: jest.fn(), deleteMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
    messageAttachment: { createMany: jest.fn() },
    messageReport: { create: jest.fn() },
    communityMembership: { findFirst: jest.fn(), createMany: jest.fn() },
    communityChannel: { findUnique: jest.fn(), create: jest.fn() },
    messagingPresenceSession: { deleteMany: jest.fn(), count: jest.fn(), create: jest.fn(), updateMany: jest.fn(), findMany: jest.fn() },
    project: { findUnique: jest.fn() },
    dueDiligence: { findUnique: jest.fn() },
    user: { findUnique: jest.fn(), findMany: jest.fn() },
  } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [{ provide: MessagingService, useFactory: () => new MessagingService(prisma as any) }, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(MessagingService);
    jest.clearAllMocks();
  });

  it('creates a direct conversation for two users and adds both members', async () => {
    prisma.conversation.findMany.mockResolvedValue([]);
    prisma.conversation.create.mockResolvedValue({ id: 'conv-1', type: 'DIRECT' });
    prisma.conversationMember.createMany.mockResolvedValue({ count: 2 });
    prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', type: 'DIRECT', members: [{ userId: 'user-1' }, { userId: 'user-2' }] });
    const result = await service.createConversation({ type: 'DIRECT', userId: 'user-1', participantIds: ['user-2'], title: 'Direct chat' });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.conversationMember.createMany).toHaveBeenCalledWith({ data: expect.arrayContaining([expect.objectContaining({ conversationId: 'conv-1', userId: 'user-1' }), expect.objectContaining({ conversationId: 'conv-1', userId: 'user-2' })]) });
    expect(result.type).toBe('DIRECT');
  });

  it('reuses an existing direct conversation instead of creating duplicate DMs', async () => {
    prisma.conversation.findMany.mockResolvedValue([{ id: 'existing', type: 'DIRECT', members: [{ userId: 'user-1' }, { userId: 'user-2' }] }]);
    await expect(service.createConversation({ type: 'DIRECT', userId: 'user-1', participantIds: ['user-2'] })).resolves.toEqual(expect.objectContaining({ id: 'existing' }));
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('requires a name for named group conversations', async () => {
    await expect(service.createConversation({ type: 'GROUP', userId: 'user-1', participantIds: ['user-2'] })).rejects.toThrow('Name your group');
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });

  it('does not eagerly add every active user to a new community channel', async () => {
    prisma.conversation.create.mockResolvedValue({ id: 'channel-conv', type: 'COMMUNITY_CHANNEL' });
    prisma.conversationMember.createMany.mockResolvedValue({ count: 1 });
    prisma.communityChannel.create.mockResolvedValue({ id: 'channel-1' });
    prisma.communityMembership.createMany.mockResolvedValue({ count: 1 });
    prisma.conversation.findUnique.mockResolvedValue({ id: 'channel-conv', type: 'COMMUNITY_CHANNEL', members: [{ userId: 'creator-1' }] });
    await service.createConversation({ type: 'COMMUNITY_CHANNEL', userId: 'creator-1', title: 'General', channelName: 'general' });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(prisma.conversationMember.createMany).toHaveBeenCalledWith({ data: [{ conversationId: 'channel-conv', userId: 'creator-1', role: 'owner' }] });
  });

  it('blocks access when a user is not a member of a private conversation', async () => {
    prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-2', type: 'DIRECT', conversationMembers: [{ userId: 'user-1' }] });
    await expect(service.ensureUserAccess('user-2', 'conv-2')).rejects.toThrow('not authorized');
  });

  it('searches messages in accessible public community channels as well as member conversations', async () => {
    prisma.message.findMany.mockResolvedValue([{ id: 'message-1', content: 'solar finance' }]);
    const result = await service.searchMessages('user-1', 'solar finance', 10);
    expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    expect(result).toHaveLength(1);
  });

  it('uses one grouped query for unread counts and preserves zero-count conversations', async () => {
    prisma.conversation.findMany.mockResolvedValue([{ id: 'conv-1' }, { id: 'conv-2' }, { id: 'conv-3' }]);
    prisma.message.groupBy.mockResolvedValue([{ conversationId: 'conv-1', _count: { _all: 3 } }]);
    await expect(service.getUnreadCounts('user-1')).resolves.toEqual([{ conversationId: 'conv-1', count: 3 }, { conversationId: 'conv-2', count: 0 }, { conversationId: 'conv-3', count: 0 }]);
    expect(prisma.message.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.message.count).not.toHaveBeenCalled();
  });

  it('persists a socket session and exposes every currently online user, excluding the current user', async () => {
    prisma.messagingPresenceSession.count.mockResolvedValue(0);
    prisma.user.findMany.mockResolvedValue([{ id: 'user-2', firstName: 'Noah', lastName: 'King', avatar: null, isActive: true, lastLogin: new Date() }]);
    service.trackUserOnline('user-1');
    await expect(service.trackUserOnline('user-1', 'socket-1')).resolves.toEqual({ firstSession: true, lastSession: false });
    expect(prisma.messagingPresenceSession.create).toHaveBeenCalledWith({ data: { userId: 'user-1', socketId: 'socket-1' } });
    await expect(service.listActiveUsers('user-1')).resolves.toEqual([expect.objectContaining({ id: 'user-2' })]);
  });

  it('does not expose stale in-memory users when persistent presence has no active sessions', async () => {
    prisma.messagingPresenceSession.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([]);
    (service as any).onlineUsers.add('user-2');

    await expect(service.listActiveUsers('user-1')).resolves.toEqual([]);
  });

  it('does not emit last-offline state while another socket for the same user remains', async () => {
    prisma.messagingPresenceSession.deleteMany.mockResolvedValue({ count: 1 });
    prisma.messagingPresenceSession.count.mockResolvedValue(1);
    await expect(service.trackUserOffline('user-1', 'socket-1')).resolves.toEqual({ firstSession: false, lastSession: false });
  });

  it('recreates a session when a stale cleanup removed the socket before its heartbeat', async () => {
    prisma.messagingPresenceSession.updateMany.mockResolvedValue({ count: 0 });
    prisma.messagingPresenceSession.create.mockResolvedValue({ id: 'presence-1', userId: 'user-1', socketId: 'socket-1' });
    await expect(service.trackUserHeartbeat('user-1', 'socket-1')).resolves.toEqual({ firstSession: true, lastSession: false });
    expect(prisma.messagingPresenceSession.create).toHaveBeenCalledWith({ data: { userId: 'user-1', socketId: 'socket-1' } });
  });

  it('toggles a reaction and returns the authoritative reaction set', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'message-1', conversationId: 'conv-1' });
    prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', type: 'DIRECT', members: [{ userId: 'user-1' }] });
    prisma.messageReaction.findUnique.mockResolvedValue(undefined);
    prisma.messageReaction.create.mockResolvedValue({ id: 'reaction-1' });
    prisma.messageReaction.findMany.mockResolvedValue([{ id: 'reaction-1', messageId: 'message-1', userId: 'user-1', reaction: '❤️' }]);
    await expect(service.toggleReaction('user-1', 'message-1', '❤️')).resolves.toEqual(expect.objectContaining({ action: 'added', messageId: 'message-1', reactions: expect.any(Array) }));
    prisma.messageReaction.findUnique.mockResolvedValue({ id: 'reaction-1' });
    prisma.messageReaction.delete.mockResolvedValue({ id: 'reaction-1' });
    prisma.messageReaction.findMany.mockResolvedValue([]);
    await expect(service.toggleReaction('user-1', 'message-1', '❤️')).resolves.toEqual(expect.objectContaining({ action: 'removed', reactions: [] }));
  });

  it('does not allow reactions on messages outside the conversation membership', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'message-1', conversationId: 'conv-1' });
    prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1', type: 'DIRECT', members: [{ userId: 'user-2', role: 'member' }] });
    await expect(service.addReaction('user-1', 'message-1', 'heart')).rejects.toThrow('not authorized');
    expect(prisma.messageReaction.upsert).not.toHaveBeenCalled();
  });

  it('allows every user to access a public community channel', async () => {
    prisma.conversation.findUnique.mockResolvedValue({ id: 'channel-conversation', type: 'COMMUNITY_CHANNEL', projectId: null, dueDiligenceId: null, members: [], channel: { id: 'channel-1', isPrivate: false } });
    await expect(service.ensureUserAccess('community-user', 'channel-conversation')).resolves.toEqual(expect.objectContaining({ id: 'channel-conversation' }));
  });

  it('lists public community channels for users who are not stored members', async () => {
    prisma.conversation.findMany.mockResolvedValue([]);
    await service.listConversations('community-user');
    expect(prisma.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { OR: [{ members: { some: { userId: 'community-user' } } }, { type: 'COMMUNITY_CHANNEL', channel: { is: { isPrivate: false } } }] } }));
  });

  it('creates recipient notifications without blocking message creation when a notification fails', async () => {
    const createForUser = jest.fn().mockRejectedValueOnce(new Error('notification unavailable')).mockResolvedValue({ id: 'notification-2' });
    const serviceWithNotifications = new MessagingService(prisma as any, { createForUser } as any);
    prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-3', type: 'DIRECT', members: [{ userId: 'user-1' }] });
    prisma.conversationMember.findMany.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-3' }]);
    prisma.message.create.mockResolvedValue({ id: 'msg-9', sender: { firstName: 'Ava' }, attachments: [], replyTo: null });
    prisma.message.findUnique.mockResolvedValue({ id: 'msg-9', sender: { firstName: 'Ava' }, attachments: [], replyTo: null, reactions: [] });
    await expect(serviceWithNotifications.createMessage({ userId: 'user-1', conversationId: 'conv-3', content: 'hello' })).resolves.toEqual(expect.objectContaining({ id: 'msg-9' }));
    expect(createForUser).toHaveBeenCalledTimes(2);
  });
});
