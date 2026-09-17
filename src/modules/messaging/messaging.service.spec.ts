import { Test } from '@nestjs/testing';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../../database/prisma.service';

describe('MessagingService', () => {
  let service: MessagingService;
  const prisma = {
    conversation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    conversationMember: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    messageRead: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    messageReaction: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    messageAttachment: {
      createMany: jest.fn(),
    },
    messageReport: {
      create: jest.fn(),
    },
    communityMembership: {
      findFirst: jest.fn(),
      createMany: jest.fn(),
    },
    notificationsService: {
      createForUser: jest.fn(),
    },
    communityChannel: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    dueDiligence: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(MessagingService);
    jest.clearAllMocks();
  });

  it('creates a direct conversation for two users and adds both members', async () => {
    prisma.conversation.findFirst.mockResolvedValue(null);
    prisma.conversation.create.mockResolvedValue({ id: 'conv-1', type: 'DIRECT' });
    prisma.conversationMember.createMany.mockResolvedValue({ count: 2 });

    const result = await service.createConversation({
      type: 'DIRECT',
      userId: 'user-1',
      participantIds: ['user-2'],
      title: 'Direct chat',
    });

    expect(prisma.conversation.create).toHaveBeenCalled();
    expect(prisma.conversationMember.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ conversationId: 'conv-1', userId: 'user-1' }),
        expect.objectContaining({ conversationId: 'conv-1', userId: 'user-2' }),
      ]),
    });
    expect(result.type).toBe('DIRECT');
  });

  it('blocks access when a user is not a member of a conversation', async () => {
    prisma.conversation.findUnique.mockResolvedValue({
      id: 'conv-2',
      type: 'DIRECT',
      conversationMembers: [{ userId: 'user-1' }],
    });
    prisma.conversationMember.findFirst.mockResolvedValue(null);

    await expect(service.ensureUserAccess('user-2', 'conv-2')).rejects.toThrow('not authorized');
  });

  it('searches only messages in conversations the user can access', async () => {
    prisma.message.findMany.mockResolvedValue([{ id: 'message-1', content: 'solar finance' }]);

    const result = await service.searchMessages('user-1', 'solar finance', 10);

    expect(prisma.message.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        content: { contains: 'solar finance', mode: 'insensitive' },
        conversation: { members: { some: { userId: 'user-1' } } },
      }),
      take: 10,
    }));
    expect(result).toHaveLength(1);
  });

  it('returns unread counts excluding the current user messages', async () => {
    prisma.conversation.findMany.mockResolvedValue([{ id: 'conv-1' }, { id: 'conv-2' }]);
    prisma.message.count.mockResolvedValueOnce(3).mockResolvedValueOnce(0);

    await expect(service.getUnreadCounts('user-1')).resolves.toEqual([
      { conversationId: 'conv-1', count: 3 },
      { conversationId: 'conv-2', count: 0 },
    ]);
    expect(prisma.message.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ senderId: { not: 'user-1' }, reads: { none: { userId: 'user-1' } } }),
    }));
  });

  it('does not allow reactions on messages outside the conversation membership', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'message-1', conversationId: 'conv-1' });
    prisma.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      type: 'DIRECT',
      members: [{ userId: 'user-2', role: 'member' }],
    });

    await expect(service.addReaction('user-1', 'message-1', 'heart')).rejects.toThrow('not authorized');
    expect(prisma.messageReaction.upsert).not.toHaveBeenCalled();
  });

  it('allows every user to access a public community channel', async () => {
    prisma.conversation.findUnique.mockResolvedValue({
      id: 'channel-conversation',
      type: 'COMMUNITY_CHANNEL',
      projectId: null,
      dueDiligenceId: null,
      members: [],
      channel: { id: 'channel-1', isPrivate: false },
    });

    await expect(service.ensureUserAccess('community-user', 'channel-conversation')).resolves.toEqual(
      expect.objectContaining({ id: 'channel-conversation' }),
    );
  });

  it('lists public community channels for users who are not stored members', async () => {
    prisma.conversation.findMany.mockResolvedValue([]);

    await service.listConversations('community-user');

    expect(prisma.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { members: { some: { userId: 'community-user' } } },
          { type: 'COMMUNITY_CHANNEL', channel: { is: { isPrivate: false } } },
        ],
      },
    }));
  });
});
