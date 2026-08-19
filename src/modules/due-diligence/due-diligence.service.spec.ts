import { DueDiligenceService } from './due-diligence.service';
import { inMemoryFallbackStore } from '../../common/services/in-memory-fallback.store';

describe('DueDiligenceService', () => {
  it('creates a notification when a diligence case is created', async () => {
    const prisma = {
      dueDiligence: {
        create: jest.fn().mockResolvedValue({ id: 'dd-1', title: 'Acme diligence' }),
      },
    };
    const notificationsService = {
      createForUser: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      createForAllUsers: jest.fn().mockResolvedValue({ count: 1 }),
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
    expect(notificationsService.createForAllUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'due_diligence_created',
        title: 'New due diligence case created',
        actorId: 'user-1',
      }),
    );
  });

  it('rejects document upload when the database is unavailable and fallback is disabled', async () => {
    const original = process.env.ALLOW_IN_MEMORY_FALLBACK;
    process.env.ALLOW_IN_MEMORY_FALLBACK = 'false';

    try {
      const prisma = {
        isDatabaseAvailable: jest.fn().mockReturnValue(false),
        dueDiligence: {
          findUnique: jest.fn().mockRejectedValue(new Error('P1001: Server is shutting down')),
        },
        dueDiligenceDocument: {
          create: jest.fn().mockRejectedValue(new Error('P1001: Server is shutting down')),
        },
        dueDiligenceAuditLog: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      const service = new DueDiligenceService(prisma as any);

      await expect(
        service.uploadDocument(
          'dd-1',
          {
            fileName: 'test.pdf',
            fileUrl: 'http://localhost/test.pdf',
            fileType: 'pdf',
            fileSize: 1234,
          } as any,
          'user-1',
        ),
      ).rejects.toThrow('Database unavailable');
    } finally {
      if (original === undefined) {
        delete process.env.ALLOW_IN_MEMORY_FALLBACK;
      } else {
        process.env.ALLOW_IN_MEMORY_FALLBACK = original;
      }
    }
  });

  it('lists every diligence case for the shared feed instead of filtering by owner', async () => {
    const prisma = {
      dueDiligence: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const service = new DueDiligenceService(prisma as any);
    await service.findAll({ page: 1, limit: 10 }, 'user-1');

    expect(prisma.dueDiligence.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 10,
      }),
    );
  });

  it('marks a diligence case as approved as soon as an admin approves it', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          roles: [{ name: 'admin' }],
        }),
      },
      dueDiligence: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'dd-1',
          title: 'Acme diligence',
          creatorId: 'user-1',
        }),
        update: jest.fn().mockResolvedValue({ id: 'dd-1', status: 'approved' }),
      },
      dueDiligenceApproval: {
        findUnique: jest.fn().mockResolvedValue({ id: 'approval-1', dueDiligenceId: 'dd-1' }),
        update: jest.fn().mockResolvedValue({ id: 'approval-1', status: 'approved' }),
        count: jest.fn().mockResolvedValue(2),
      },
      dueDiligenceAuditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const service = new DueDiligenceService(prisma as any);
    await service.approveOrReject('dd-1', 'approval-1', { status: 'approved', approvalNotes: 'Approve' }, 'user-1');

    expect(prisma.dueDiligence.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dd-1' },
        data: expect.objectContaining({ status: 'approved' }),
      }),
    );
  });

  it('blocks approval for non-admin users', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-2',
          roles: [{ name: 'member' }],
        }),
      },
      dueDiligence: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'dd-1',
          title: 'Acme diligence',
          creatorId: 'user-1',
        }),
      },
    };

    const service = new DueDiligenceService(prisma as any);

    await expect(
      service.approveOrReject('dd-1', 'approval-1', { status: 'approved', approvalNotes: 'Approve' }, 'user-2'),
    ).rejects.toThrow('Only admins can approve due diligence cases');
  });

  it('allows admins to delete another user\'s due diligence case', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'admin-1',
          roles: [{ name: 'admin' }],
        }),
      },
      dueDiligence: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'dd-1',
          title: 'Acme diligence',
          creatorId: 'owner-1',
        }),
        delete: jest.fn().mockResolvedValue({ id: 'dd-1' }),
      },
      dueDiligenceAuditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const service = new DueDiligenceService(prisma as any);

    await expect(service.delete('dd-1', 'admin-1')).resolves.toEqual({ id: 'dd-1' });
    expect(prisma.dueDiligence.delete).toHaveBeenCalledWith({ where: { id: 'dd-1' } });
  });
});
