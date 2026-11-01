import { NotFoundException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ProjectWaitlistStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class ProjectMarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, skip = 0, take = 50) {
    this.ensureDatabase();
    const normalizedSkip = Number.isFinite(skip) ? Math.max(0, Math.floor(skip)) : 0;
    const normalizedTake = Number.isFinite(take) ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(take))) : 50;
    const where = { status: 'funding', isPublished: true };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: normalizedSkip,
        take: normalizedTake,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          projectType: true,
          capacityKwp: true,
          thumbnail: true,
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    const projectIds = projects.map((project) => project.id);
    const waitlistEntries = projectIds.length
      ? await this.prisma.projectWaitlistEntry.findMany({
        where: {
          userId,
          status: ProjectWaitlistStatus.JOINED,
          projectId: { in: projectIds },
        },
        select: { projectId: true },
      })
      : [];
    const waitlistedIds = new Set(waitlistEntries.map((entry) => entry.projectId));

    return {
      data: projects.map((project) => ({
        ...project,
        isWaitlisted: waitlistedIds.has(project.id),
      })),
      total,
      skip: normalizedSkip,
      take: normalizedTake,
    };
  }

  async joinWaitlist(userId: string, projectId: string) {
    this.ensureDatabase();

    return this.prisma.$transaction(async (transaction) => {
      const project = await transaction.project.findFirst({
        where: { id: projectId, status: 'funding', isPublished: true },
        select: { id: true },
      });
      if (!project) throw new NotFoundException('Project not found');

      const uniqueKey = { projectId_userId: { projectId, userId } };
      const existing = await transaction.projectWaitlistEntry.findUnique({
        where: uniqueKey,
        select: { id: true, status: true, joinedAt: true },
      });
      if (existing?.status === ProjectWaitlistStatus.JOINED) {
        return { projectId, isWaitlisted: true, joinedAt: existing.joinedAt };
      }

      const joinedAt = new Date();
      const entry = await transaction.projectWaitlistEntry.upsert({
        where: uniqueKey,
        create: {
          userId,
          projectId,
          status: ProjectWaitlistStatus.JOINED,
          joinedAt,
        },
        update: {
          status: ProjectWaitlistStatus.JOINED,
          joinedAt,
          withdrawnAt: null,
        },
        select: { id: true, joinedAt: true },
      });
      await transaction.projectWaitlistEvent.create({
        data: { entryId: entry.id, action: ProjectWaitlistStatus.JOINED },
      });

      return { projectId, isWaitlisted: true, joinedAt: entry.joinedAt };
    });
  }

  async leaveWaitlist(userId: string, projectId: string) {
    this.ensureDatabase();

    return this.prisma.$transaction(async (transaction) => {
      const entry = await transaction.projectWaitlistEntry.findUnique({
        where: { projectId_userId: { projectId, userId } },
        select: { id: true, status: true },
      });
      if (!entry || entry.status === ProjectWaitlistStatus.WITHDRAWN) {
        return { projectId, isWaitlisted: false };
      }

      const withdrawnAt = new Date();
      await transaction.projectWaitlistEntry.update({
        where: { id: entry.id },
        data: { status: ProjectWaitlistStatus.WITHDRAWN, withdrawnAt },
      });
      await transaction.projectWaitlistEvent.create({
        data: { entryId: entry.id, action: ProjectWaitlistStatus.WITHDRAWN },
      });

      return { projectId, isWaitlisted: false, withdrawnAt };
    });
  }

  private ensureDatabase() {
    if (!this.prisma.isDatabaseAvailable()) {
      throw new ServiceUnavailableException('Project marketplace data is unavailable while the database is offline.');
    }
  }
}
