import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('lists persisted notifications without seeding announcement records', async () => {
    const prisma = {
      isDatabaseAvailable: jest.fn().mockReturnValue(true),
      notification: {
        findMany: jest.fn().mockResolvedValue([{ id: 'notification-1', isRead: false }]),
      },
    };

    const service = new NotificationsService(prisma as any);
    const result = await service.listForUser('user-1');

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    );
    expect(result).toEqual([{ id: 'notification-1', isRead: false }]);
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
