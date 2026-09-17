import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
};

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private readonly onlineUsers = new Set<string>();

  constructor(
    @Inject(PrismaService) private readonly prisma: MessagingPrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  trackUserOnline(userId: string) {
    if (!userId) return;
    this.onlineUsers.add(userId);
  }

  trackUserOffline(userId: string) {
    if (!userId) return;
    this.onlineUsers.delete(userId);
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

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

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
      if (!dueDiligence) {
        throw new ForbiddenException('Investment room is not available');
      }
      const allowed = [dueDiligence.creatorId, dueDiligence.assignedToId].filter(Boolean).includes(userId);
      if (!allowed) {
        throw new ForbiddenException('You are not authorized to access this investment room');
      }
    }

    if (conversation.type === 'COMMUNITY_CHANNEL' && conversation.channel?.isPrivate) {
      const membership = await this.prisma.communityMembership.findFirst({
        where: { channelId: conversation.channel.id, userId },
        select: { id: true },
      });
      if (!membership) {
        throw new ForbiddenException('You are not a member of this channel');
      }
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
    let participantIds = Array.from(new Set((payload.participantIds ?? []).filter(Boolean)));
    if (payload.type === 'COMMUNITY_CHANNEL' && participantIds.length === 0) {
      const communityMembers = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      participantIds = communityMembers.map((member) => member.id);
    }
    const members = [payload.userId, ...participantIds.filter((id) => id !== payload.userId)];

    if (payload.type === 'DIRECT' && members.length !== 2) {
      throw new BadRequestException('Direct conversations require exactly two users');
    }

    if (payload.type === 'PROJECT_ROOM' && !payload.projectId) {
      throw new BadRequestException('Project room requires a projectId');
    }

    if (payload.type === 'INVESTMENT_ROOM' && !payload.dueDiligenceId) {
      throw new BadRequestException('Investment room requires a dueDiligenceId');
    }

    if (payload.type === 'PROJECT_ROOM' && payload.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: payload.projectId },
        select: { id: true, teamMembers: { select: { id: true } } },
      });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      const allowed = project.teamMembers.some((member) => member.id === payload.userId);
      if (!allowed) {
        throw new ForbiddenException('You cannot create a project room for a project you do not belong to');
      }
    }

    if (payload.type === 'INVESTMENT_ROOM' && payload.dueDiligenceId) {
      const dueDiligence = await this.prisma.dueDiligence.findUnique({
        where: { id: payload.dueDiligenceId },
        select: { id: true, creatorId: true, assignedToId: true },
      });
      if (!dueDiligence) {
        throw new NotFoundException('Due diligence record not found');
      }
      const allowed = [dueDiligence.creatorId, dueDiligence.assignedToId].includes(payload.userId);
      if (!allowed) {
        throw new ForbiddenException('You are not authorized to create an investment room');
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: payload.type,
        title: payload.title ?? null,
        description: payload.description ?? null,
        avatar: payload.avatar ?? null,
        creatorId: payload.userId,
        projectId: payload.projectId ?? null,
        dueDiligenceId: payload.dueDiligenceId ?? null,
      },
      include: { members: true },
    });

    const memberRows = members.map((memberId) => ({
      conversationId: conversation.id,
      userId: memberId,
      role: memberId === payload.userId ? 'owner' : 'member',
    }));

    await this.prisma.conversationMember.createMany({ data: memberRows });

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
        data: members.map((memberId) => ({
          channelId: channel.id,
          userId: memberId,
          role: memberId === payload.userId ? 'admin' : 'member',
        })),
      });
    }

    return conversation;
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [
          { members: { some: { userId } } },
          { type: 'COMMUNITY_CHANNEL', channel: { is: { isPrivate: false } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        members: {
          select: { userId: true, role: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    });
  }

  async listActiveUsers(userId: string) {
    const onlineIds = [...this.onlineUsers].filter((id) => id !== userId);
    if (!onlineIds.length) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        isActive: true,
        id: { in: onlineIds, not: userId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async searchMessages(userId: string, searchTerm: string, limit = 25) {
    const normalizedTerm = searchTerm.trim();
    if (!normalizedTerm) {
      return [];
    }

    return this.prisma.message.findMany({
      where: {
        isDeleted: false,
        content: { contains: normalizedTerm, mode: 'insensitive' },
        conversation: { members: { some: { userId } } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        conversation: { select: { id: true, title: true, type: true } },
      },
    });
  }

  async getUnreadCounts(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      select: { id: true },
    });

    const counts = await Promise.all((conversations as Array<{ id: string }>).map(async ({ id }) => ({
      conversationId: id,
      count: await this.prisma.message.count({
        where: {
          conversationId: id,
          senderId: { not: userId },
          isDeleted: false,
          reads: { none: { userId } },
        },
      }),
    })));

    return counts;
  }

  async getConversation(userId: string, conversationId: string) {
    await this.ensureUserAccess(userId, conversationId);
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
          },
        },
        channel: true,
      },
    });
  }

  async getMessages(userId: string, conversationId: string, cursor?: string, limit = 25) {
    await this.ensureUserAccess(userId, conversationId);

    const query: any = {
      where: {
        conversationId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' as const },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
        replyTo: {
          include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        },
        attachments: true,
        reactions: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
      },
      take: limit,
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const messages = await this.prisma.message.findMany(query);
    return [...messages].reverse();
  }

  async createMessage(payload: {
    userId: string;
    conversationId: string;
    content?: string;
    type?: string;
    replyToId?: string;
    mentions?: string[];
    attachmentData?: Array<{ fileName: string; mimeType: string; size: number; storageKey: string; url: string }>;
  }) {
    await this.ensureUserAccess(payload.userId, payload.conversationId);

    const replyToId = payload.replyToId;
    if (replyToId) {
      const reply = await this.prisma.message.findUnique({ where: { id: replyToId }, select: { id: true, conversationId: true } });
      if (!reply || reply.conversationId !== payload.conversationId) {
        throw new BadRequestException('Reply must reference a message in the same conversation');
      }
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: payload.conversationId },
      select: { id: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: payload.conversationId,
        senderId: payload.userId,
        content: payload.content ?? '',
        messageType: (payload.type ?? 'TEXT') as any,
        replyToId: payload.replyToId ?? null,
        mentions: payload.mentions ? JSON.stringify(payload.mentions) : undefined,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        replyTo: { include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
        attachments: true,
      },
    });

    if (payload.attachmentData?.length) {
      await this.prisma.messageAttachment.createMany({
        data: payload.attachmentData.map((attachment) => ({
          messageId: message.id,
          uploadedById: payload.userId,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          storageKey: attachment.storageKey,
          url: attachment.url,
        })),
      });
    }

    await this.prisma.conversation.update({
      where: { id: payload.conversationId },
      data: { lastMessageAt: new Date(), updatedAt: new Date() },
    });

    const mentionedUserIds = Array.isArray(payload.mentions) ? payload.mentions : [];
    const uniqueMentionIds = Array.from(new Set(mentionedUserIds));
    for (const recipientId of uniqueMentionIds) {
      if (recipientId === payload.userId) continue;
      if (this.notificationsService) {
        await this.notificationsService.createForUser(recipientId, {
          type: 'message-mention',
          title: 'You were mentioned',
          message: `${message.sender.firstName ?? 'Someone'} mentioned you in conversation`,
          data: { conversationId: payload.conversationId, messageId: message.id },
        });
      }
    }

    return this.prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        attachments: true,
        replyTo: { include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
        reactions: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
      },
    });
  }

  async updateMessage(userId: string, messageId: string, content: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, conversationId: true, isDeleted: true },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.ensureUserAccess(userId, message.conversationId);
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }
    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit a deleted message');
    }
    return this.prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true, updatedAt: new Date() },
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, conversationId: true },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.ensureUserAccess(userId, message.conversationId);
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true, deletedAt: new Date(), content: '[deleted]', updatedAt: new Date() },
    });

    return { success: true, id: messageId };
  }

  async addReaction(userId: string, messageId: string, reaction: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { id: true, conversationId: true } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.ensureUserAccess(userId, message.conversationId);

    return this.prisma.messageReaction.upsert({
      where: { messageId_userId_reaction: { messageId, userId, reaction } },
      update: {},
      create: { messageId, userId, reaction },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async removeReaction(userId: string, messageId: string, reaction: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { id: true, conversationId: true } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.ensureUserAccess(userId, message.conversationId);
    await this.prisma.messageReaction.deleteMany({
      where: { messageId, userId, reaction },
    });

    return { success: true };
  }

  async markMessagesRead(userId: string, messageIds: string[]) {
    if (!messageIds.length) {
      return { count: 0 };
    }
    const uniqueIds = Array.from(new Set(messageIds));
    const accessibleMessages = await this.prisma.message.findMany({
      where: { id: { in: uniqueIds }, conversation: { members: { some: { userId } } } },
      select: { id: true },
    });
    const accessibleIds = new Set((accessibleMessages as Array<{ id: string }>).map((message) => message.id));
    const authorizedIds = uniqueIds.filter((id) => accessibleIds.has(id));
    if (!authorizedIds.length) {
      return { count: 0 };
    }
    const existing = await this.prisma.messageRead.findMany({
      where: { userId, messageId: { in: authorizedIds } },
      select: { messageId: true },
    });
    const existingSet = new Set((existing as Array<{ messageId: string }>).map((item) => item.messageId));
    const insertRows = authorizedIds.filter((id) => !existingSet.has(id)).map((messageId) => ({ userId, messageId }));
    if (insertRows.length === 0) {
      return { count: 0 };
    }
    await this.prisma.messageRead.createMany({ data: insertRows });
    return { count: insertRows.length };
  }

  async reportMessage(userId: string, messageId: string, reason: string, details?: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { id: true, conversationId: true } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.ensureUserAccess(userId, message.conversationId);
    return this.prisma.messageReport.create({
      data: { messageId, reporterId: userId, reason, details: details ?? null },
    });
  }

  async uploadAttachment(userId: string, conversationId: string, file?: Express.Multer.File) {
    await this.ensureUserAccess(userId, conversationId);
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    return {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey: `messaging/${file.filename}`,
      url: `/uploads/messaging/${file.filename}`,
    };
  }
}
