import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';

export interface CreateBroadcastNotificationInput {
  type: string;
  title: string;
  message: string;
  actorId?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createForAllUsers(input: CreateBroadcastNotificationInput) {
    const users = await this.prisma.user.findMany({
      select: { id: true },
      where: input.actorId ? { id: { not: input.actorId } } : undefined,
    });

    const recipients = input.actorId ? users.filter((user) => user.id !== input.actorId) : users;

    const notifications: Prisma.NotificationCreateManyInput[] = recipients.map((user) => ({
      type: input.type,
      title: input.title,
      message: input.message,
      data: (input.data ?? {}) as Prisma.InputJsonValue,
      userId: user.id,
      isRead: false,
    }));

    if (notifications.length === 0) {
      return { count: 0 };
    }

    return this.prisma.notification.createMany({ data: notifications });
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
