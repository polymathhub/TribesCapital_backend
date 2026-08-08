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

  it('falls back to in-memory storage when document upload database is unavailable', async () => {
    const prisma = {
      dueDiligence: {
        findUnique: jest.fn().mockRejectedValue(new Error('P1001: Server is shutting down')),
      },
      dueDiligenceDocument: {
        create: jest.fn().mockRejectedValue(new Error('P1001: Server is shutting down')),
      },
    };

    const service = new DueDiligenceService(prisma as any);
    const fallbackDd = inMemoryFallbackStore.createDueDiligence(
      {
        title: 'Fallback Case',
        description: 'Fallback case',
        type: 'investment',
        targetName: 'FallbackCo',
        targetType: 'company',
      },
      'user-1',
    );

    const createdDocument = await service.uploadDocument(
      fallbackDd.id,
      {
        fileName: 'test.pdf',
        fileUrl: 'http://localhost/test.pdf',
        fileType: 'pdf',
        fileSize: 1234,
      } as any,
      'user-1',
    );

    expect(createdDocument).toMatchObject({
      fileName: 'test.pdf',
      fileUrl: 'http://localhost/test.pdf',
      fileType: 'pdf',
      fileSize: 1234,
      category: 'general',
      uploadedById: 'user-1',
    });
    expect(prisma.dueDiligenceDocument.create).toHaveBeenCalled();
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
});
