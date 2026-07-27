import { DueDiligenceService } from './due-diligence.service';

describe('DueDiligenceService', () => {
  it('creates a notification when a diligence case is created', async () => {
    const prisma = {
      dueDiligence: {
        create: jest.fn().mockResolvedValue({ id: 'dd-1', title: 'Acme diligence' }),
      },
    };
    const notificationsService = {
      createForUser: jest.fn().mockResolvedValue({ id: 'notification-1' }),
    };

    const service = new DueDiligenceService(prisma as any, notificationsService as any);
    await service.create(
      {
        title: 'Acme diligence',
        description: 'Review the company',
        type: 'investment' as any,
        targetName: 'Acme',
        targetType: 'company',
      },
      'user-1',
    );

    expect(notificationsService.createForUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        type: 'due_diligence_created',
        title: 'Due diligence case created',
      }),
    );
  });
});
