import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('creates the contributor announcement once per user', async () => {
    const prisma = {
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
    };

    const service = new NotificationsService(prisma as any);
    await service.ensureAnnouncementNotificationForUser('user-1');

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1', type: 'announcement' }),
      }),
    );
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'announcement',
          title: 'New contributor announcement',
        }),
      }),
    );
  });

  it('marks a notification as read only for the current user', async () => {
    const prisma = {
      notification: {
        findFirst: jest.fn().mockResolvedValue({ id: 'notification-1' }),
        update: jest.fn().mockResolvedValue({ id: 'notification-1', isRead: true }),
      },
    };

    const service = new NotificationsService(prisma as any);
    await service.markAsRead('notification-1', 'user-1');

    expect(prisma.notification.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'notification-1', userId: 'user-1' },
        select: { id: true },
      }),
    );
    expect(prisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'notification-1' },
        data: { isRead: true },
      }),
    );
  });
});
