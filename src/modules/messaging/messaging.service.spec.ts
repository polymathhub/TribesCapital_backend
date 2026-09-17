import { Test } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../../database/prisma.service';

describe('MessagingService', () => {
  let service: MessagingService;
  const prisma = {
    conversation: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    conversationMember: { createMany: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    message: { findMany: jest.fn(), create: jest.fn(), count: jest.fn(), groupBy: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    messageRead: { upsert: jest.fn(), findMany: jest.fn(), createMany: jest.fn() },
    messageReaction: { upsert: jest.fn(), deleteMany: jest.fn() },
    messageAttachment: { createMany: jest.fn() },
    messageReport: { create: jest.fn() },
    communityMembership: { findFirst: jest.fn(), createMany: jest.fn() },
    communityChannel: { findUnique: jest.fn(), create: jest.fn() },
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
    prisma.conversation.create.mockResolvedValue({ id: 'conv-1', type: 'DIRECT' });
    prisma.conversationMember.createMany.mockResolvedValue({ count: 2 });

    const result = await service.createConversation({ type: 'DIRECT', userId: 'user-1', participantIds: ['user-2'], title: 'Direct chat' });

    expect(prisma.conversationMember.createMany).toHaveBeenCalledWith({ data: expect.arrayContaining([
      expect.objectContaining({ conversationId: 'conv-1', userId: 'user-1' }),
      expect.objectContaining({ conversationId: 'conv-1', userId: 'user-2' }),
    ]) });
    expect(result.type).toBe('DIRECT');
  });

  it('does not eagerly add every active user to a new community channel', async () => {
    prisma.conversation.create.mockResolvedValue({ id: 'channel-conv', type: 'COMMUNITY_CHANNEL' });
    prisma.conversationMember.createMany.mockResolvedValue({ count: 1 });
    prisma.communityChannel.create.mockResolvedValue({ id: 'channel-1' });
    prisma.communityMembership.createMany.mockResolvedValue({ count: 1 });

    await service.createConversation({ type: 'COMMUNITY_CHANNEL', userId: 'creator-1', title: 'General', channelName: 'general' });

    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(prisma.conversationMember.createMany).toHaveBeenCalledWith({ data: [
      { conversationId: 'channel-conv', userId: 'creator-1', role: 'owner' },
    ] });
  });

  it('blocks access when a user is not a member of a private conversation', async () => {
    prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-2', type: 'DIRECT', conversationMembers: [{ userId: 'user-1' }] });
    await expect(service.ensureUserAccess('user-2', 'conv-2')).rejects.toThrow('not authorized');
  });

  it('searches messages in accessible public community channels as well as member conversations', async () => {
    prisma.message.findMany.mockResolvedValue([{ id: 'message-1', content: 'solar finance' }]);
    const result = await service.searchMessages('user-1', 'solar finance', 10);

    expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ conversation: { OR: [
        { members: { some: { userId: 'user-1' } } },
        { type: 'COMMUNITY_CHANNEL', channel: { is: { isPrivate: false } } },
      ] } }),
      take: 10,
    }));
    expect(result).toHaveLength(1);
  });

  it('uses one grouped query for unread counts and preserves zero-count conversations', async () => {
    prisma.conversation.findMany.mockResolvedValue([{ id: 'conv-1' }, { id: 'conv-2' }, { id: 'conv-3' }]);
    prisma.message.groupBy.mockResolvedValue([{ conversationId: 'conv-1', _count: { _all: 3 } }]);

    await expect(service.getUnreadCounts('user-1')).resolves.toEqual([
      { conversationId: 'conv-1', count: 3 },
      { conversationId: 'conv-2', count: 0 },
      { conversationId: 'conv-3', count: 0 },
    ]);
    expect(prisma.message.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.message.count).not.toHaveBeenCalled();
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
    expect(prisma.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { OR: [
      { members: { some: { userId: 'community-user' } } },
      { type: 'COMMUNITY_CHANNEL', channel: { is: { isPrivate: false } } },
    ] } }));
  });

  it('lists active users using live presence and excluding the current user', async () => {
    service.trackUserOnline('user-2');
    prisma.user.findMany.mockResolvedValue([{ id: 'user-2', firstName: 'Ava', lastName: 'Scott', avatar: null, isActive: true }]);
    const result = await service.listActiveUsers('user-1');
    expect(result).toEqual([expect.objectContaining({ id: 'user-2', firstName: 'Ava' })]);
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: true, id: { in: ['user-2'] } }, orderBy: { firstName: 'asc' } }));
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

  it('sends mention notifications once and avoids duplicate generic notifications', async () => {
    const createForUser = jest.fn().mockResolvedValue({ id: 'notification-1' });
    const serviceWithNotifications = new MessagingService(prisma as any, { createForUser } as any);
    prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-4', type: 'GROUP', members: [{ userId: 'user-1' }] });
    prisma.conversationMember.findMany.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-3' }]);
    prisma.message.create.mockResolvedValue({ id: 'msg-10', sender: { firstName: 'Ava' }, attachments: [], replyTo: null });
    prisma.message.findUnique.mockResolvedValue({ id: 'msg-10', sender: { firstName: 'Ava' }, attachments: [], replyTo: null, reactions: [] });

    await serviceWithNotifications.createMessage({ userId: 'user-1', conversationId: 'conv-4', content: 'hello @user-2', mentions: ['user-2'] });

    expect(createForUser).toHaveBeenCalledWith('user-2', expect.objectContaining({ type: 'message-mention' }));
    expect(createForUser).toHaveBeenCalledWith('user-3', expect.objectContaining({ type: 'new-message' }));
    expect(createForUser).toHaveBeenCalledTimes(2);
  });
});
