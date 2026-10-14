import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import {
  CreateLeadDraftDto,
  SubmitLeadDto,
  AdminLeadListQueryDto,
  AssignLeadReviewerDto,
  TransitionLeadDto,
} from './lead-submissions.dto';
import { stableJson, validateLeadPayload, getUkClockStartAt } from './lead-submissions.utils';

@Injectable()
export class LeadSubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: AdminLeadListQueryDto) {
    this.ensureDatabase();
    const where: Prisma.LeadSubmissionWhereInput = {
      OR: [{ submitterId: userId }, { reviewerId: userId }],
      ...(query.status ? { status: query.status } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
      ...(query.countryCode ? { countryCode: query.countryCode } : {}),
      ...(query.search
        ? {
            OR: [
              { submitterName: { contains: query.search, mode: 'insensitive' } },
              { submitterEmail: { contains: query.search, mode: 'insensitive' } },
              { siteName: { contains: query.search, mode: 'insensitive' } },
              { offtakerLegalName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.leadSubmission.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        include: { events: { orderBy: { createdAt: 'desc' }, take: 5 } },
      }),
      this.prisma.leadSubmission.count({ where }),
    ]);

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getById(id: string, userId: string) {
    this.ensureDatabase();
    const submission = await this.prisma.leadSubmission.findFirst({
      where: {
        id,
        OR: [{ submitterId: userId }, { reviewerId: userId }],
      },
      include: { events: { orderBy: { createdAt: 'desc' } } },
    });

    if (!submission) throw new NotFoundException('Lead submission not found');
    return submission;
  }

  async createDraft(userId: string, dto: CreateLeadDraftDto) {
    this.ensureDatabase();

    const payload = dto.payload ?? {};
    const submission = await this.prisma.leadSubmission.create({
      data: {
        leadRef: this.generateLeadRef(),
        status: 'draft',
        submitterId: userId,
        payload: payload as unknown as Prisma.InputJsonValue,
        submissionFingerprint: stableJson(payload),
      },
    });

    return submission;
  }

  async updateDraft(userId: string, id: string, payload: Record<string, unknown>) {
    this.ensureDatabase();
    const submission = await this.prisma.leadSubmission.findFirst({
      where: { id, submitterId: userId, status: 'draft' },
    });

    if (!submission) throw new NotFoundException('Draft not found');

    const updated = await this.prisma.leadSubmission.update({
      where: { id },
      data: {
        payload: payload as Prisma.InputJsonObject,
        submissionFingerprint: stableJson(payload),
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  async submitLead(userId: string, dto: SubmitLeadDto) {
    this.ensureDatabase();
    if (!dto.payload) throw new BadRequestException({ code: 'LEAD_PAYLOAD_REQUIRED', message: 'Provide the lead details before submitting.' });

    const normalized = validateLeadPayload(dto.payload);
    const submittedAt = new Date();
    const leadRef = this.generateLeadRef();

    const submission = await this.prisma.leadSubmission.create({
      data: {
        leadRef,
        status: 'submitted',
        channel: normalized.channel,
        submitterId: userId,
        payload: normalized as unknown as Prisma.InputJsonValue,
        submitterName: normalized.submitter.name,
        submitterEmail: normalized.submitter.email,
        submitterPhone: normalized.submitter.phone,
        partnerOrganisation: normalized.submitter.organisation,
        siteName: normalized.site.name,
        siteLatitude: normalized.site.latitude,
        siteLongitude: normalized.site.longitude,
        countryCode: normalized.site.countryCode,
        countryName: normalized.site.countryName,
        offtakerLegalName: normalized.offtaker.legalName,
        registrationNumber: normalized.offtaker.registrationNumber,
        submissionFingerprint: stableJson(normalized),
        submittedAt,
        clockStartAt: getUkClockStartAt(submittedAt),
        marketingConsent: normalized.consent.marketing,
      },
    });

    const eventData = { payload: JSON.parse(JSON.stringify(normalized)) } as Prisma.InputJsonObject;

    await this.prisma.leadEvent.create({
      data: {
        submissionId: submission.id,
        actorId: userId,
        actorRole: 'submitter',
        type: 'submitted',
        oldStatus: null,
        newStatus: 'submitted',
        reason: 'Lead submitted by the submitter',
        data: eventData,
      },
    });

    return submission;
  }

  async assignReviewer(userId: string, id: string, dto: AssignLeadReviewerDto) {
    this.ensureDatabase();
    const submission = await this.prisma.leadSubmission.findFirst({
      where: { id, OR: [{ submitterId: userId }, { reviewerId: userId }] },
    });

    if (!submission) throw new NotFoundException('Lead submission not found');

    const next = await this.prisma.leadSubmission.update({
      where: { id },
      data: {
        reviewerId: dto.reviewerId ?? submission.reviewerId,
        status: submission.status === 'draft' ? 'in_review' : submission.status,
        updatedAt: new Date(),
      },
    });

    await this.prisma.leadEvent.create({
      data: {
        submissionId: id,
        actorId: userId,
        actorRole: 'reviewer',
        type: 'reviewer_assigned',
        oldStatus: submission.status,
        newStatus: next.status,
        reason: dto.reason,
        data: { reviewerId: dto.reviewerId ?? submission.reviewerId },
      },
    });

    return next;
  }

  async transitionStatus(userId: string, id: string, dto: TransitionLeadDto) {
    this.ensureDatabase();
    const submission = await this.prisma.leadSubmission.findFirst({
      where: { id, OR: [{ submitterId: userId }, { reviewerId: userId }] },
    });

    if (!submission) throw new NotFoundException('Lead submission not found');

    const next = await this.prisma.leadSubmission.update({
      where: { id },
      data: {
        status: dto.status,
        updatedAt: new Date(),
        ...(dto.status === 'in_review' ? { firstResponseAt: submission.firstResponseAt ?? new Date() } : {}),
      },
    });

    await this.prisma.leadEvent.create({
      data: {
        submissionId: id,
        actorId: userId,
        actorRole: 'reviewer',
        type: 'status_changed',
        oldStatus: submission.status,
        newStatus: dto.status,
        reason: dto.reason,
        data: { status: dto.status },
      },
    });

    return next;
  }

  private generateLeadRef(): string {
    const random = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `LEAD-${Date.now()}-${random}`;
  }

  private ensureDatabase() {
    if (!this.prisma.isDatabaseAvailable()) {
      throw new ServiceUnavailableException('Lead submission data is unavailable while the database is offline.');
    }
  }
}
