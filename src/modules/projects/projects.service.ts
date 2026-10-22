import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateProjectDto, ProjectSubmissionDto, UpdateProjectDto } from './dto/project.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService, private readonly uploadsService: UploadsService) {}

  async list(userId: string, skip = 0, take = 50, status?: string) {
    this.ensureDatabase();
    const normalizedSkip = Number.isFinite(skip) ? Math.max(0, Math.floor(skip)) : 0;
    const normalizedTake = Number.isFinite(take) ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(take))) : 50;
    const where = {
      AND: [
        { OR: [{ isPublished: true }, { creatorId: userId }, { teamMembers: { some: { id: userId } } }] },
        ...(status ? [{ status }] : []),
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: normalizedSkip,
        take: normalizedTake,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, skip: normalizedSkip, take: normalizedTake };
  }

  async getById(id: string, userId: string) {
    this.ensureDatabase();
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        OR: [{ isPublished: true }, { creatorId: userId }, { teamMembers: { some: { id: userId } } }],
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(userId: string, dto: CreateProjectDto) {
    this.ensureDatabase();
    if (dto.status && dto.status !== 'origination') {
      throw new BadRequestException('New projects enter the pipeline at origination; later stages require an authorized workflow decision');
    }
    this.validateAttachments(userId, dto.attachments);
    return this.prisma.project.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        projectType: dto.projectType,
        location: dto.location?.trim(),
        capacityKwp: dto.capacityKwp,
        managingContractor: dto.managingContractor?.trim(),
        notes: dto.notes?.trim(),
        pipelineMetadata: dto.pipelineMetadata as Prisma.InputJsonObject | undefined,
        attachments: dto.attachments as Prisma.InputJsonArray | undefined,
        status: 'origination',
        creatorId: userId,
      },
    });
  }

  async submit(userId: string, dto: ProjectSubmissionDto) {
    this.ensureDatabase();
    const submitter = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true },
    });
    if (!submitter) throw new NotFoundException('Submitting account not found');
    if (submitter.accountType === 'GUEST') {
      throw new ForbiddenException('A registered account is required to submit a project');
    }

    return this.prisma.project.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        projectType: dto.projectType,
        location: dto.location?.trim(),
        capacityKwp: dto.capacityKwp,
        contactEmail: dto.contactEmail?.trim().toLowerCase(),
        status: 'submitted',
        isPublished: false,
        creatorId: userId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    const project = await this.getEditableProject(id, userId);
    this.validateAttachments(userId, dto.attachments);
    return this.prisma.project.update({
      where: { id: project.id },
      data: {
        ...dto,
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        location: dto.location?.trim(),
        managingContractor: dto.managingContractor?.trim(),
        notes: dto.notes?.trim(),
        pipelineMetadata: dto.pipelineMetadata as Prisma.InputJsonObject | undefined,
        attachments: dto.attachments as Prisma.InputJsonArray | undefined,
      },
    });
  }

  async updateStatus(id: string, userId: string, status: string) {
    const project = await this.getEditableProject(id, userId);
    if (project.status === status) return project;
    throw new ForbiddenException('Project lifecycle stages can only be changed through an authorized review or investment decision');
  }

  async remove(id: string, userId: string) {
    const project = await this.getEditableProject(id, userId);
    await this.prisma.project.delete({ where: { id: project.id } });
    return { id: project.id };
  }

  async getAttachmentDownloadUrl(id: string, userId: string, index: number) {
    const project = await this.getById(id, userId);
    const attachments = Array.isArray(project.attachments) ? project.attachments as Array<{ storageKey?: string; url?: string }> : [];
    const attachment = attachments[index];
    if (!attachment) throw new NotFoundException('Project attachment not found');
    if (!attachment.storageKey) return attachment.url;
    return this.uploadsService.getSignedDownloadUrl(attachment.storageKey);
  }

  private validateAttachments(userId: string, attachments?: Array<{ storageKey: string; url: string }>) {
    if (!attachments) return;
    for (const attachment of attachments) {
      let localUrl = false;
      if (attachment.storageKey?.startsWith(`uploads/${userId}/project-pipeline/`) && attachment.url?.startsWith('/')) {
        try {
          const parsedUrl = new URL(attachment.url, 'https://local.invalid');
          localUrl = parsedUrl.pathname.endsWith('/uploads/multipart/file')
            && parsedUrl.searchParams.get('key') === attachment.storageKey;
        } catch {
          localUrl = false;
        }
      }
      if (
        !attachment.storageKey?.startsWith(`uploads/${userId}/project-pipeline/`)
        || (!attachment.url?.startsWith('https://') && !localUrl)
      ) {
        throw new BadRequestException('Invalid project attachment location');
      }
    }
  }

  private async getEditableProject(id: string, userId: string) {
    this.ensureDatabase();
    const project = await this.prisma.project.findFirst({
      where: { id, OR: [{ creatorId: userId }, { teamMembers: { some: { id: userId } } }] },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.creatorId !== userId) throw new ForbiddenException('Only the project creator can modify this project');
    return project;
  }

  private ensureDatabase() {
    if (!this.prisma.isDatabaseAvailable()) {
      throw new ServiceUnavailableException('Project data is unavailable while the database is offline.');
    }
  }
}