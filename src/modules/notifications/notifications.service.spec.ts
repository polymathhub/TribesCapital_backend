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
});
