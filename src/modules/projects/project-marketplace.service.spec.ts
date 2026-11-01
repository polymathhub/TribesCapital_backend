import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ProjectWaitlistStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { ProjectMarketplaceService } from './project-marketplace.service';

describe('ProjectMarketplaceService', () => {
  const transaction = {
    project: {
      findFirst: jest.fn(),
    },
    projectWaitlistEntry: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    projectWaitlistEvent: {
      create: jest.fn(),
    },
  };
  const prismaMock = {
    isDatabaseAvailable: jest.fn(),
    project: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    projectWaitlistEntry: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((operation: (tx: typeof transaction) => Promise<unknown>) => operation(transaction)),
  };
  const service = new ProjectMarketplaceService(prismaMock as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.isDatabaseAvailable.mockReturnValue(true);
    prismaMock.project.findMany.mockResolvedValue([]);
    prismaMock.project.count.mockResolvedValue(0);
    prismaMock.projectWaitlistEntry.findMany.mockResolvedValue([]);
    transaction.project.findFirst.mockResolvedValue({ id: 'project-1' });
    transaction.projectWaitlistEntry.findUnique.mockResolvedValue(null);
    transaction.projectWaitlistEntry.upsert.mockResolvedValue({ id: 'entry-1', joinedAt: new Date('2026-01-01T00:00:00Z') });
    transaction.projectWaitlistEntry.update.mockResolvedValue({});
    transaction.projectWaitlistEvent.create.mockResolvedValue({});
  });

  it('lists only published Funding projects with an allowlisted response and the current user waitlist state', async () => {
    prismaMock.project.findMany.mockResolvedValue([
      { id: 'project-1', title: 'Solar project', projectType: 'Solar', capacityKwp: 450, thumbnail: '/solar.jpg' },
    ]);
    prismaMock.project.count.mockResolvedValue(1);
    prismaMock.projectWaitlistEntry.findMany.mockResolvedValue([{ projectId: 'project-1' }]);

    const result = await service.list('user-1', 0, 20);

    expect(prismaMock.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'funding', isPublished: true },
      select: {
        id: true,
        title: true,
        projectType: true,
        capacityKwp: true,
        thumbnail: true,
      },
    }));
    expect(prismaMock.projectWaitlistEntry.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        status: ProjectWaitlistStatus.JOINED,
        projectId: { in: ['project-1'] },
      },
      select: { projectId: true },
    });
    expect(result.data).toEqual([
      {
        id: 'project-1',
        title: 'Solar project',
        projectType: 'Solar',
        capacityKwp: 450,
        thumbnail: '/solar.jpg',
        isWaitlisted: true,
      },
    ]);
  });

  it('persists a waitlist join once and returns success for an existing join', async () => {
    const joinedAt = new Date('2026-01-01T00:00:00Z');
    transaction.projectWaitlistEntry.upsert.mockResolvedValue({ id: 'entry-1', joinedAt });

    const result = await service.joinWaitlist('user-1', 'project-1');

    expect(transaction.project.findFirst).toHaveBeenCalledWith({
      where: { id: 'project-1', status: 'funding', isPublished: true },
      select: { id: true },
    });
    expect(transaction.projectWaitlistEntry.upsert).toHaveBeenCalled();
    expect(transaction.projectWaitlistEvent.create).toHaveBeenCalledWith({
      data: { entryId: 'entry-1', action: ProjectWaitlistStatus.JOINED },
    });
    expect(result).toEqual({ projectId: 'project-1', isWaitlisted: true, joinedAt });

    transaction.projectWaitlistEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      status: ProjectWaitlistStatus.JOINED,
      joinedAt,
    });
    transaction.projectWaitlistEvent.create.mockClear();

    const repeatedResult = await service.joinWaitlist('user-1', 'project-1');

    expect(repeatedResult).toEqual({ projectId: 'project-1', isWaitlisted: true, joinedAt });
    expect(transaction.projectWaitlistEntry.upsert).toHaveBeenCalledTimes(1);
    expect(transaction.projectWaitlistEvent.create).not.toHaveBeenCalled();
  });

  it('does not allow joining an unpublished or non-Funding project', async () => {
    transaction.project.findFirst.mockResolvedValue(null);

    await expect(service.joinWaitlist('user-1', 'project-1')).rejects.toThrow(NotFoundException);
    expect(transaction.projectWaitlistEntry.upsert).not.toHaveBeenCalled();
  });

  it('withdraws an active waitlist entry and records the change', async () => {
    transaction.projectWaitlistEntry.findUnique.mockResolvedValue({
      id: 'entry-1',
      status: ProjectWaitlistStatus.JOINED,
    });

    const result = await service.leaveWaitlist('user-1', 'project-1');

    expect(transaction.projectWaitlistEntry.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'entry-1' },
      data: expect.objectContaining({ status: ProjectWaitlistStatus.WITHDRAWN }),
    }));
    expect(transaction.projectWaitlistEvent.create).toHaveBeenCalledWith({
      data: { entryId: 'entry-1', action: ProjectWaitlistStatus.WITHDRAWN },
    });
    expect(result).toEqual(expect.objectContaining({ projectId: 'project-1', isWaitlisted: false }));
  });

  it('fails explicitly when the database is unavailable', async () => {
    prismaMock.isDatabaseAvailable.mockReturnValue(false);

    await expect(service.list('user-1')).rejects.toThrow(ServiceUnavailableException);
  });
});
