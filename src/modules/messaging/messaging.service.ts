import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export type ConversationType = 'DIRECT' | 'GROUP' | 'COMMUNITY_CHANNEL' | 'PROJECT_ROOM' | 'INVESTMENT_ROOM';

type MessagingPrismaService = PrismaService & {
  conversation: any;
  conversationMember: any;
  message: any;
  messageReaction: any;
  messageRead: any;
  messageAttachment: any;
  communityChannel: any;
  communityMembership: any;
  messageReport: any;
  messagingPresenceSession: any;
};

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: MessagingPrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  private async withAdvisoryLock<T>(key: string, operation: (tx: any) => Promise<T>): Promise<T> {
    const transaction = (this.prisma as any).$transaction;
    if (typeof transaction !== 'function') return operation(this.prisma);
    return transaction.call(this.prisma, async (tx: any) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
      return operation(tx);
    });
  }

  async trackUserOnline(userId: string, socketId: string) {
    if (!userId || !socketId) return { firstSession: false };
    return this.withAdvisoryLock(`messaging:presence:${userId}`, async (tx) => {
      await tx.messagingPresenceSession.deleteMany({ where: { socketId } });
      const existing = await tx.messagingPresenceSession.count({ where: { userId } });
      await tx.messagingPresenceSession.create({ data: { userId, socketId } });
      return { firstSession: existing === 0 };
    });
  }

  async trackUserHeartbeat(userId: string, socketId: string) {
    if (!userId || !socketId) return { firstSession: false };
    return this.withAdvisoryLock(`messaging:presence:${userId}`, async (tx) => {
      const updated = await tx.messagingPresenceSession.updateMany({
        where: { userId, socketId },
        data: { updatedAt: new Date() },
      });
      if (updated.count > 0) return { firstSession: false };
      await tx.messagingPresenceSession.create({ data: { userId, socketId } });
      return { firstSession: true };
    });
  }

  async trackUserOffline(userId: string, socketId: string) {
    if (!userId || !socketId) return { lastSession: false };
    return this.withAdvisoryLock(`messaging:presence:${userId}`, async (tx) => {
      await tx.messagingPresenceSession.deleteMany({ where: { userId, socketId } });
      const remaining = await tx.messagingPresenceSession.count({ where: { userId } });
      return { lastSession: remaining === 0 };
    });
  }

  async listActiveUsers() {
    const cutoff = new Date(Date.now() - 60_000);
    await this.prisma.messagingPresenceSession.deleteMany({ where: { updatedAt: { lt: cutoff } } });
    const sessions = await this.prisma.messagingPresenceSession.findMany({
      where: { updatedAt: { gte: cutoff } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const onlineIds = sessions.map((session: { userId: string }) => session.userId).filter(Boolean);
    if (!onlineIds.length) return [];

    const users = await this.prisma.user.findMany({
      where: { isActive: true, id: { in: onlineIds } },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true, isActive: true, lastLogin: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    return users.map((user) => ({ ...user, presence: 'online' as const }));
  }

  async ensureUserAccess(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        type: true,
        projectId: true,
        dueDiligenceId: true,
        channel: { select: { id: true, isPrivate: true } },
        members: { select: { userId: true, role: true } },
      },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const members = (conversation as any).members ?? (conversation as any).conversationMembers ?? [];
    const isMember = members.some((member: { userId: string }) => member.userId === userId);
    const isPublicCommunityChannel = conversation.type === 'COMMUNITY_CHANNEL' && conversation.channel && !conversation.channel.isPrivate;
    if (!isMember && !isPublicCommunityChannel) {
      throw new ForbiddenException('You are not authorized to access this conversation');
    }

    if (conversation.type === 'PROJECT_ROOM' && conversation.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: conversation.projectId },
        select: { id: true, teamMembers: { select: { id: true } } },
      });
      if (!project || !project.teamMembers.some((member) => member.id === userId)) {
        throw new ForbiddenException('You do not have access to this project room');
      }
    }

    if (conversation.type === 'INVESTMENT_ROOM' && conversation.dueDiligenceId) {
      const dueDiligence = await this.prisma.dueDiligence.findUnique({
        where: { id: conversation.dueDiligenceId },
        select: { id: true, assignedToId: true, creatorId: true },
      });
      if (!dueDiligence) throw new ForbiddenException('Investment room is not available');
      const allowed = [dueDiligence.creatorId, dueDiligence.assignedToId].filter(Boolean).includes(userId);
      if (!allowed) throw new ForbiddenException('You are not authorized to access this investment room');
    }

    if (conversation.type === 'COMMUNITY_CHANNEL' && conversation.channel?.isPrivate) {
      const membership = await this.prisma.communityMembership.findFirst({
        where: { channelId: conversation.channel.id, userId },
        select: { id: true },
      });
      if (!membership) throw new ForbiddenException('You are not a member of this channel');
    }

    return conversation;
  }

  async createConversation(payload: {
    type: ConversationType;
    userId: string;
    participantIds?: string[];
    title?: string;
    description?: string;
    avatar?: string;
    projectId?: string;
    dueDiligenceId?: string;
    channelName?: string;
    isPrivateChannel?: boolean;
  }) {
    const participantIds = Array.from(new Set((payload.participantIds ?? []).filter(Boolean)));
    const members = [payload.userId, ...participantIds.filter((id) => id !== payload.userId)];

    if (payload.type === 'DIRECT' && members.length !== 2) {
      throw new BadRequestException('Direct conversations require exactly two users');
    }
    if (payload.type === 'GROUP') {
      if (members.length < 2) throw new BadRequestException('Group conversations require at least two people');
      if (!payload.title?.trim()) throw new BadRequestException('Name your group before creating it');
    }
    if (payload.type === 'PROJECT_ROOM' && !payload.projectId) {
      throw new BadRequestException('Project room requires a projectId');
    }
    if (payload.type === 'INVESTMENT_ROOM' && !payload.dueDiligenceId) {
      throw new BadRequestException('Investment room requires a dueDiligenceId');
    }

    if (payload.type === 'DIRECT') {
      const directKey = `messaging:direct:${[payload.userId, members[1]].sort().join(':')}`;
      return this.withAdvisoryLock(directKey, async (tx) => {
        const existing = await tx.conversation.findFirst({
          where: {
            type: 'DIRECT',
            AND: [
              { members: { some: { userId: payload.userId } } },
              { members: { some: { userId: members[1] } } },
            ],
          },
          include: { members: true },
        });
        if (existing) return existing;

        const conversation = await tx.conversation.create({
          data: {
            type: 'DIRECT',
            title: null,
            description: payload.description ?? null,
            avatar: payload.avatar ?? null,
            creatorId: payload.userId,
          },
          include: { members: true },
        });
        await tx.conversationMember.createMany({
          data: members.map((memberId) => ({ conversationId: conversation.id, userId: memberId, role: memberId === payload.userId ? 'owner' : 'member' })),
        });
        return tx.conversation.findUnique({
          where: { id: conversation.id },
          include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } } },
        });
      });
    }

    if (payload.type === 'PROJECT_ROOM' && payload.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: payload.projectId },
        select: { id: true, teamMembers: { select: { id: true } } },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (!project.teamMembers.some((member) => member.id === payload.userId)) {
        throw new ForbiddenException('You cannot create a project room for a project you do not belong to');
      }
    }

    if (payload.type === 'INVESTMENT_ROOM' && payload.dueDiligenceId) {
      const dueDiligence = await this.prisma.dueDiligence.findUnique({
        where: { id: payload.dueDiligenceId },
        select: { id: true, creatorId: true, assignedToId: true },
      });
      if (!dueDiligence) throw new NotFoundException('Due diligence record not found');
      if (![dueDiligence.creatorId, dueDiligence.assignedToId].includes(payload.userId)) {
        throw new ForbiddenException('You are not authorized to create an investment room');
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: payload.type,
        title: payload.title?.trim() || null,
        description: payload.description ?? null,
        avatar: payload.avatar ?? null,
        creatorId: payload.userId,
        projectId: payload.projectId ?? null,
        dueDiligenceId: payload.dueDiligenceId ?? null,
      },
      include: { members: true },
    });

    await this.prisma.conversationMember.createMany({
      data: members.map((memberId) => ({ conversationId: conversation.id, userId: memberId, role: memberId === payload.userId ? 'owner' : 'member' })),
    });

    if (payload.type === 'COMMUNITY_CHANNEL') {
      const channel = await this.prisma.communityChannel.create({
        data: {
          name: payload.channelName ?? payload.title ?? 'Community channel',
          description: payload.description ?? null,
          isPrivate: Boolean(payload.isPrivateChannel),
          creatorId: payload.userId,
          conversationId: conversation.id,
        },
      });
      await this.prisma.communityMembership.createMany({
        data: members.map((memberId) => ({ channelId: channel.id, userId: memberId, role: memberId === payload.userId ? 'admin' : 'member' })),
      });
    }

    return this.prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } } },
    });
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { OR: [{ members: { some: { userId } } }, { type: 'COMMUNITY_CHANNEL', channel: { is: { isPrivate: false } } }] },
      orderBy: { updatedAt: 'desc' },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
      },
    });
  }

  async searchMessages(userId: string, searchTerm: string, limit = 25) {
    const normalizedTerm = searchTerm.trim();
    if (!normalizedTerm) return [];
    return this.prisma.message.findMany({
      where: { isDeleted: false, content: { contains: normalizedTerm, mode: 'insensitive' }, conversation: { OR: [{ members: { some: { userId } } }, { type: 'COMMUNITY_CHANNEL', channel: { is: { isPrivate: false } } }] } },
      orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(limit, 1), 100),
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }, conversation: { select: { id: true, title: true, type: true } } },
    });
  }

  async getUnreadCounts(userId: string) {
    const conversations = await this.prisma.conversation.findMany({ where: { members: { some: { userId } } }, select: { id: true } });
    const conversationIds = (conversations as Array<{ id: string }>).map(({ id }) => id);
    if (!conversationIds.length) return [];
    const grouped = await this.prisma.message.groupBy({ by: ['conversationId'], where: { conversationId: { in: conversationIds }, senderId: { not: userId }, isDeleted: false, reads: { none: { userId } } }, _count: { _all: true } });
    const counts = new Map(grouped.map((item: any) => [item.conversationId, item._count._all]));
    return conversationIds.map((conversationId) => ({ conversationId, count: counts.get(conversationId) ?? 0 }));
  }

  async getConversation(userId: string, conversationId: string) {
    await this.ensureUserAccess(userId, conversationId);
    return this.prisma.conversation.findUnique({ where: { id: conversationId }, include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } } } }, channel: true } });
  }

  async getMessages(userId: string, conversationId: string, cursor?: string, limit = 25) {
    await this.ensureUserAccess(userId, conversationId);
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? Math.floor(limit) : 25, 1), 100);
    const query: any = {
      where: { conversationId, isDeleted: false }, orderBy: { createdAt: 'desc' as const },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } }, replyTo: { include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } } }, attachments: true, reactions: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } } }, take: safeLimit,
    };
    if (cursor) { query.cursor = { id: cursor }; query.skip = 1; }
    const messages = await this.prisma.message.findMany(query);
    return [...messages].reverse();
  }

  private async notifySafely(recipientId: string, payload: { type: string; title: string; message: string; data: Record<string, string> }) {
    if (!this.notificationsService || !recipientId) return;
    try { await this.notificationsService.createForUser(recipientId, payload); }
    catch (error) { this.logger.warn(`Messaging notification failed for ${recipientId}: ${error instanceof Error ? error.message : 'unknown error'}`); }
  }

  async createMessage(payload: { userId: string; conversationId: string; content?: string; type?: string; replyToId?: string; mentions?: string[]; attachmentData?: Array<{ fileName: string; mimeType: string; size: number; storageKey: string; url: string }> }) {
    await this.ensureUserAccess(payload.userId, payload.conversationId);
    const content = payload.content?.trim() ?? '';
    if (!content && !payload.attachmentData?.length) throw new BadRequestException('Message content or an attachment is required');
    if (payload.replyToId) {
      const reply = await this.prisma.message.findUnique({ where: { id: payload.replyToId }, select: { id: true, conversationId: true } });
      if (!reply || reply.conversationId !== payload.conversationId) throw new BadRequestException('Reply must reference a message in the same conversation');
    }
    const conversation = await this.prisma.conversation.findUnique({ where: { id: payload.conversationId }, select: { id: true } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    const message = await this.prisma.message.create({ data: { conversationId: payload.conversationId, senderId: payload.userId, content, messageType: (payload.type ?? 'TEXT') as any, replyToId: payload.replyToId ?? null, mentions: payload.mentions?.length ? JSON.stringify(payload.mentions) : undefined }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }, replyTo: { include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } } }, attachments: true } });
    if (payload.attachmentData?.length) await this.prisma.messageAttachment.createMany({ data: payload.attachmentData.map((attachment) => ({ messageId: message.id, uploadedById: payload.userId, fileName: attachment.fileName, mimeType: attachment.mimeType, size: attachment.size, storageKey: attachment.storageKey, url: attachment.url })) });
    await this.prisma.conversation.update({ where: { id: payload.conversationId }, data: { lastMessageAt: new Date(), updatedAt: new Date() } });
    const members = await this.prisma.conversationMember.findMany({ where: { conversationId: payload.conversationId }, select: { userId: true } });
    const mentionedUserIds = Array.from(new Set((payload.mentions ?? []).filter((id) => id && id !== payload.userId)));
    const mentionedSet = new Set(mentionedUserIds);
    const recipientIds = Array.from(new Set((members as Array<{ userId: string }>).map((member) => member.userId).filter((id) => Boolean(id) && id !== payload.userId && !mentionedSet.has(id))));
    if (this.notificationsService) await Promise.allSettled([...recipientIds.map((recipientId) => this.notifySafely(recipientId, { type: 'new-message', title: 'New message', message: `${message.sender.firstName ?? 'Someone'} sent a message`, data: { conversationId: payload.conversationId, messageId: message.id } })), ...mentionedUserIds.map((recipientId) => this.notifySafely(recipientId, { type: 'message-mention', title: 'You were mentioned', message: `${message.sender.firstName ?? 'Someone'} mentioned you in conversation`, data: { conversationId: payload.conversationId, messageId: message.id } }))]);
    return this.prisma.message.findUnique({ where: { id: message.id }, include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } }, attachments: true, replyTo: { include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } } }, reactions: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } } } });
  }

  async updateMessage(userId: string, messageId: string, content: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { id: true, senderId: true, conversationId: true, isDeleted: true } });
    if (!message) throw new NotFoundException('Message not found');
    await this.ensureUserAccess(userId, message.conversationId);
    if (message.senderId !== userId) throw new ForbiddenException('You can only edit your own messages');
    if (message.isDeleted) throw new BadRequestException('Cannot edit a deleted message');
    const normalizedContent = content?.trim();
    if (!normalizedContent) throw new BadRequestException('Message content cannot be empty');
    return this.prisma.message.update({ where: { id: messageId }, data: { content: normalizedContent, isEdited: true, updatedAt: new Date() } });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { id: true, senderId: true, conversationId: true } });
    if (!message) throw new NotFoundException('Message not found');
    await this.ensureUserAccess(userId, message.conversationId);
    if (message.senderId !== userId) throw new ForbiddenException('You can only delete your own messages');
    await this.prisma.message.update({ where: { id: messageId }, data: { isDeleted: true, deletedAt: new Date(), content: '[deleted]', updatedAt: new Date() } });
    return { success: true, id: messageId };
  }

  private async getReactionState(messageId: string) {
    return this.prisma.messageReaction.findMany({ where: { messageId }, include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: 'asc' } });
  }

  async toggleReaction(userId: string, messageId: string, reaction: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { id: true, conversationId: true } });
    if (!message) throw new NotFoundException('Message not found');
    await this.ensureUserAccess(userId, message.conversationId);
    const normalizedReaction = reaction?.trim();
    if (!normalizedReaction) throw new BadRequestException('Reaction cannot be empty');
    return this.withAdvisoryLock(`messaging:reaction:${messageId}:${userId}:${normalizedReaction}`, async (tx) => {
      const existing = await tx.messageReaction.findUnique({ where: { messageId_userId_reaction: { messageId, userId, reaction: normalizedReaction } } });
      let action: 'added' | 'removed';
      if (existing) {
        await tx.messageReaction.delete({ where: { id: existing.id } });
        action = 'removed';
      } else {
        await tx.messageReaction.create({ data: { messageId, userId, reaction: normalizedReaction } });
        action = 'added';
      }
      const reactions = await tx.messageReaction.findMany({ where: { messageId }, include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }, orderBy: { createdAt: 'asc' } });
      return { messageId, reaction: normalizedReaction, userId, action, reactions };
    });
  }

  async addReaction(userId: string, messageId: string, reaction: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { id: true, conversationId: true } });
    if (!message) throw new NotFoundException('Message not found');
    await this.ensureUserAccess(userId, message.conversationId);
    const normalizedReaction = reaction?.trim();
    if (!normalizedReaction) throw new BadRequestException('Reaction cannot be empty');
    return this.prisma.messageReaction.upsert({ where: { messageId_userId_reaction: { messageId, userId, reaction: normalizedReaction } }, update: {}, create: { messageId, userId, reaction: normalizedReaction }, include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } });
  }

  async removeReaction(userId: string, messageId: string, reaction: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { id: true, conversationId: true } });
    if (!message) throw new NotFoundException('Message not found');
    await this.ensureUserAccess(userId, message.conversationId);
    const normalizedReaction = reaction?.trim();
    await this.prisma.messageReaction.deleteMany({ where: { messageId, userId, reaction: normalizedReaction } });
    return { success: true, messageId, reaction: normalizedReaction };
  }

  async markMessagesRead(userId: string, messageIds: string[]) {
    if (!messageIds.length) return { count: 0 };
    const uniqueIds = Array.from(new Set(messageIds));
    const accessibleMessages = await this.prisma.message.findMany({ where: { id: { in: uniqueIds }, conversation: { OR: [{ members: { some: { userId } } }, { type: 'COMMUNITY_CHANNEL', channel: { is: { isPrivate: false } } }] } }, select: { id: true } });
    const accessibleIds = new Set((accessibleMessages as Array<{ id: string }>).map((message) => message.id));
    const authorizedIds = uniqueIds.filter((id) => accessibleIds.has(id));
    if (!authorizedIds.length) return { count: 0 };
    const existing = await this.prisma.messageRead.findMany({ where: { userId, messageId: { in: authorizedIds } }, select: { messageId: true } });
    const existingSet = new Set((existing as Array<{ messageId: string }>).map((item) => item.messageId));
    const insertRows = authorizedIds.filter((id) => !existingSet.has(id)).map((messageId) => ({ userId, messageId }));
    if (!insertRows.length) return { count: 0 };
    await this.prisma.messageRead.createMany({ data: insertRows });
    return { count: insertRows.length };
  }

  async reportMessage(userId: string, messageId: string, reason: string, details?: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { id: true, conversationId: true } });
    if (!message) throw new NotFoundException('Message not found');
    await this.ensureUserAccess(userId, message.conversationId);
    return this.prisma.messageReport.create({ data: { messageId, reporterId: userId, reason, details: details ?? null } });
  }

  async uploadAttachment(userId: string, conversationId: string, file?: Express.Multer.File) {
    await this.ensureUserAccess(userId, conversationId);
    if (!file) throw new BadRequestException('A file is required');
    return { fileName: file.originalname, mimeType: file.mimetype, size: file.size, storageKey: `messaging/${file.filename}`, url: `/uploads/messaging/${file.filename}` };
  }
}
