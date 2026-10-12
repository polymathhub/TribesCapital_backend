import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import {
  AdminListQueryDto,
  AdminUpdateUserDto,
  AssignReviewerDto,
  CreateDiligenceFromProjectDto,
  CreateInvestmentApprovalDto,
  InvestmentDecisionDto,
  ProjectScreeningDecisionDto,
} from './dto/admin-operations.dto';

const MAX_PAGE_SIZE = 100;
const ACTIVE_DILIGENCE_STATUSES = ['draft', 'in_progress', 'review'];
const COMPLETED_ITEM_STATUS = 'completed';
const APPROVER_ROLE = 'investment-approver';
const PROJECT_REVIEWER_ROLE = 'project-reviewer';
const DILIGENCE_REVIEWER_ROLES = ['diligence-reviewer', APPROVER_ROLE];

const normalizePage = (page: number, limit: number) => {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(limit))) : 20;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

const jsonValue = (value: Record<string, unknown>): Prisma.InputJsonObject => value as Prisma.InputJsonObject;

@Injectable()
export class AdminOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    this.ensureDatabase();
    const [
      totalUsers,
      investors,
      communityMembers,
      submittedProjects,
      informationRequestedProjects,
      unassignedSubmissions,
      projectsInDiligence,
      activeDiligence,
      unassignedDiligence,
      outstandingChecklistItems,
      outstandingDocuments,
      pendingInvestmentDecisions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { accountType: 'INVESTOR' } }),
      this.prisma.user.count({ where: { accountType: 'COMMUNITY_MEMBER' } }),
      this.prisma.project.count({ where: { status: 'submitted' } }),
      this.prisma.project.count({ where: { status: 'information_requested' } }),
      this.prisma.project.count({ where: { status: { in: ['submitted', 'information_requested'] }, reviewerId: null } }),
      this.prisma.project.count({ where: { status: 'due-diligence' } }),
      this.prisma.dueDiligence.count({ where: { status: { in: ACTIVE_DILIGENCE_STATUSES } } }),
      this.prisma.dueDiligence.count({ where: { status: { in: ACTIVE_DILIGENCE_STATUSES }, assignedToId: null } }),
      this.prisma.dueDiligenceItem.count({ where: { status: { not: COMPLETED_ITEM_STATUS }, dueDiligence: { status: { in: ACTIVE_DILIGENCE_STATUSES } } } }),
      this.prisma.dueDiligenceDocument.count({ where: { status: { in: ['pending_review', 'revise_needed', 'rejected'] }, dueDiligence: { status: { in: ACTIVE_DILIGENCE_STATUSES } } } }),
      this.prisma.dueDiligenceApproval.count({ where: { status: 'pending' } }),
    ]);

    return {
      totalUsers,
      investors,
      communityMembers,
      submittedProjects,
      informationRequestedProjects,
      unassignedSubmissions,
      projectsInDiligence,
      activeDiligence,
      unassignedDiligence,
      outstandingChecklistItems,
      outstandingDocuments,
      pendingInvestmentDecisions,
    };
  }

  async listProjects(query: AdminListQueryDto) {
    this.ensureDatabase();
    const { page, limit, skip } = normalizePage(query.page, query.limit);
    const where: Prisma.ProjectWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { creator: { OR: [{ email: { contains: search, mode: 'insensitive' } }, { firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }] } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          title: true,
          description: true,
          projectType: true,
          location: true,
          capacityKwp: true,
          contactEmail: true,
          status: true,
          reviewerId: true,
          createdAt: true,
          updatedAt: true,
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
          diligenceCases: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              status: true,
              completionPercent: true,
              assignedTo: { select: { id: true, firstName: true, lastName: true } },
              _count: {
                select: {
                  items: true,
                  documents: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getProject(projectId: string) {
    this.ensureDatabase();
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        description: true,
        projectType: true,
        location: true,
        capacityKwp: true,
        contactEmail: true,
        status: true,
        reviewerId: true,
        createdAt: true,
        updatedAt: true,
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
        diligenceCases: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            completionPercent: true,
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            items: {
              select: { id: true, title: true, category: true, status: true, priority: true, dueDate: true },
            },
            documents: {
              select: { id: true, fileName: true, category: true, status: true, reviewedAt: true },
            },
            approvals: {
              select: { id: true, status: true, level: true, approverId: true, approverRole: true },
              orderBy: [{ level: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async listDiligence(query: AdminListQueryDto) {
    this.ensureDatabase();
    const { page, limit, skip } = normalizePage(query.page, query.limit);
    const where: Prisma.DueDiligenceWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { targetName: { contains: search, mode: 'insensitive' } },
        { project: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.dueDiligence.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          title: true,
          targetName: true,
          status: true,
          priority: true,
          completionPercent: true,
          targetDeadline: true,
          project: { select: { id: true, title: true, status: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: {
            orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
            select: {
              id: true,
              title: true,
              category: true,
              status: true,
              priority: true,
              dueDate: true,
              assignedTo: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          documents: {
            select: { id: true, fileName: true, category: true, status: true, reviewedAt: true },
          },
          approvals: {
            select: {
              id: true,
              status: true,
              level: true,
              approverId: true,
              approverRole: true,
              approver: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: [{ level: 'asc' }, { createdAt: 'asc' }],
          },
        },
      }),
      this.prisma.dueDiligence.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async listUsers(query: AdminListQueryDto) {
    this.ensureDatabase();
    const { page, limit, skip } = normalizePage(query.page, query.limit);
    const where: Prisma.UserWhereInput = {};
    if (query.accountType) where.accountType = query.accountType;
    if (query.role) where.roles = { some: { name: query.role } };
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          accountType: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          roles: { select: { id: true, name: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async listRoles() {
    this.ensureDatabase();
    return this.prisma.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateUser(userId: string, actorId: string, dto: AdminUpdateUserDto) {
    this.ensureDatabase();
    if (userId === actorId) throw new BadRequestException('Administrators cannot change their own account access');
    if (dto.accountType === undefined && dto.isActive === undefined && dto.roleIds === undefined) {
      throw new BadRequestException('Provide at least one account field to update');
    }

    return this.prisma.$transaction(async (tx) => {
      const actor = await tx.user.findUnique({
        where: { id: actorId },
        select: { isActive: true, roles: { select: { name: true } } },
      });
      if (!actor?.isActive) throw new ForbiddenException('An active administrator account is required');
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, accountType: true, isActive: true, roles: { select: { id: true, name: true } } },
      });
      if (!target) throw new NotFoundException('User not found');
      const nextRoleIds = dto.roleIds ?? target.roles.map((role) => role.id);
      const nextRoles = dto.roleIds === undefined
        ? target.roles
        : await tx.role.findMany({ where: { id: { in: nextRoleIds } }, select: { id: true, name: true } });
      if (nextRoles.length !== nextRoleIds.length) throw new BadRequestException('One or more selected roles do not exist');

      const isSuperAdmin = actor.roles.some((role) => role.name === 'super-admin');
      const targetPrivilegedRoles = target.roles.filter((role) => ['admin', 'super-admin'].includes(role.name)).map((role) => role.name).sort();
      const nextPrivilegedRoles = nextRoles.filter((role) => ['admin', 'super-admin'].includes(role.name)).map((role) => role.name).sort();
      if (!isSuperAdmin && JSON.stringify(targetPrivilegedRoles) !== JSON.stringify(nextPrivilegedRoles)) {
        throw new ForbiddenException('Only a super-admin can grant or revoke administrator roles');
      }

      const targetHasAdmin = target.roles.some((role) => role.name === 'admin' || role.name === 'super-admin');
      const targetWillHaveAdmin = nextRoles.some((role) => role.name === 'admin' || role.name === 'super-admin');
      const targetWillBeActive = dto.isActive ?? target.isActive;
      if (targetHasAdmin && (!targetWillHaveAdmin || !targetWillBeActive)) {
        const activeAdminCount = await tx.user.count({
          where: { isActive: true, roles: { some: { name: { in: ['admin', 'super-admin'] } } } },
        });
        if (activeAdminCount <= 1) throw new ConflictException('The last active administrator cannot be removed or deactivated');
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          ...(dto.accountType ? { accountType: dto.accountType } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.roleIds !== undefined ? { roles: { set: nextRoleIds.map((id) => ({ id })) } } : {}),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          accountType: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          roles: { select: { id: true, name: true } },
        },
      });
      await tx.adminAuditLog.create({
        data: {
          action: 'UPDATE_USER_ACCESS',
          actorId,
          subjectUserId: userId,
          reason: dto.reason.trim(),
          oldValue: jsonValue({
            accountType: target.accountType,
            isActive: target.isActive,
            roleIds: target.roles.map((role) => role.id),
          }),
          newValue: jsonValue({
            accountType: updated.accountType,
            isActive: updated.isActive,
            roleIds: updated.roles.map((role) => role.id),
          }),
        },
      });
      return updated;
    });
  }

  async assignProjectReviewer(projectId: string, actorId: string, dto: AssignReviewerDto) {
    this.ensureDatabase();
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id: projectId }, select: { id: true, title: true, reviewerId: true } });
      if (!project) throw new NotFoundException('Project not found');
      const reviewerId = dto.reviewerId || null;
      if (reviewerId) await this.assertEligibleUser(tx, reviewerId, [PROJECT_REVIEWER_ROLE]);
      if (reviewerId === project.reviewerId) return project;
      const updated = await tx.project.update({ where: { id: projectId }, data: { reviewerId } });
      await tx.projectAuditLog.create({
        data: {
          action: 'REVIEWER_ASSIGNED',
          actorId,
          projectId,
          reason: dto.reason.trim(),
          oldValue: jsonValue({ reviewerId: project.reviewerId }),
          newValue: jsonValue({ reviewerId }),
        },
      });
      return updated;
    });
  }

  async decideProject(projectId: string, actorId: string, dto: ProjectScreeningDecisionDto) {
    this.ensureDatabase();
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { id: true, title: true, status: true, reviewerId: true },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (project.reviewerId !== actorId) throw new ForbiddenException('Only the assigned reviewer can decide this submission');
      if (!['submitted', 'information_requested'].includes(project.status)) {
        throw new ConflictException('This submission is no longer awaiting an initial review');
      }
      const nextStatus = dto.decision === 'approve'
        ? 'scoping'
        : dto.decision === 'reject'
          ? 'rejected'
          : 'information_requested';
      const updated = await tx.project.update({ where: { id: projectId }, data: { status: nextStatus } });
      await tx.projectAuditLog.create({
        data: {
          action: `SUBMISSION_${dto.decision.toUpperCase()}`,
          actorId,
          projectId,
          reason: dto.reason.trim(),
          oldValue: jsonValue({ status: project.status }),
          newValue: jsonValue({ status: nextStatus }),
        },
      });
      return updated;
    });
  }

  async createDiligenceForProject(projectId: string, actorId: string, dto: CreateDiligenceFromProjectDto) {
    this.ensureDatabase();
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { id: true, title: true, description: true, status: true },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (!['scoping', 'due-diligence'].includes(project.status)) {
        throw new ConflictException('Only an accepted submission can enter due diligence');
      }
      const linkedCase = await tx.dueDiligence.findFirst({ where: { projectId }, select: { id: true } });
      if (linkedCase) throw new ConflictException('A diligence case is already linked to this project');
      if (dto.assignedToId) await this.assertEligibleUser(tx, dto.assignedToId, DILIGENCE_REVIEWER_ROLES);
      const diligence = await tx.dueDiligence.create({
        data: {
          title: dto.title?.trim() || `${project.title} due diligence`,
          description: project.description,
          type: 'investment',
          status: 'draft',
          priority: 'medium',
          targetName: project.title,
          targetType: 'project',
          targetMetadata: jsonValue({ projectId }),
          creatorId: actorId,
          assignedToId: dto.assignedToId || null,
          projectId,
        },
        select: { id: true, title: true, status: true, projectId: true, assignedToId: true, createdAt: true },
      });
      if (project.status !== 'due-diligence') {
        await tx.project.update({ where: { id: projectId }, data: { status: 'due-diligence' } });
      }
      await tx.projectAuditLog.create({
        data: {
          action: 'DILIGENCE_OPENED',
          actorId,
          projectId,
          reason: 'Due diligence case created and linked to the accepted project.',
          oldValue: jsonValue({ status: project.status, diligenceId: null }),
          newValue: jsonValue({ status: 'due-diligence', diligenceId: diligence.id }),
        },
      });
      await tx.dueDiligenceAuditLog.create({
        data: {
          action: 'CREATE',
          entity: 'DueDiligence',
          entityId: diligence.id,
          actorId,
          dueDiligenceId: diligence.id,
          newValue: jsonValue({ projectId, status: diligence.status }),
        },
      });
      return diligence;
    });
  }

  async assignDiligenceReviewer(diligenceId: string, actorId: string, dto: AssignReviewerDto) {
    this.ensureDatabase();
    return this.prisma.$transaction(async (tx) => {
      const diligence = await tx.dueDiligence.findUnique({
        where: { id: diligenceId },
        select: { id: true, assignedToId: true },
      });
      if (!diligence) throw new NotFoundException('Due diligence case not found');
      const assignedToId = dto.reviewerId || null;
      if (assignedToId) await this.assertEligibleUser(tx, assignedToId, DILIGENCE_REVIEWER_ROLES);
      if (assignedToId === diligence.assignedToId) return diligence;
      const updated = await tx.dueDiligence.update({ where: { id: diligenceId }, data: { assignedToId } });
      await tx.dueDiligenceAuditLog.create({
        data: {
          action: 'ASSIGNEE_CHANGED',
          entity: 'DueDiligence',
          entityId: diligenceId,
          actorId,
          dueDiligenceId: diligenceId,
          reason: dto.reason.trim(),
          oldValue: jsonValue({ assignedToId: diligence.assignedToId }),
          newValue: jsonValue({ assignedToId }),
        },
      });
      return updated;
    });
  }

  async createInvestmentApproval(diligenceId: string, actorId: string, dto: CreateInvestmentApprovalDto) {
    this.ensureDatabase();
    return this.prisma.$transaction(async (tx) => {
      const diligence = await tx.dueDiligence.findUnique({ where: { id: diligenceId }, select: { id: true, status: true } });
      if (!diligence) throw new NotFoundException('Due diligence case not found');
      if (['approved', 'rejected', 'completed'].includes(diligence.status)) {
        throw new ConflictException('A final decision has already been recorded for this case');
      }
      await this.assertEligibleUser(tx, dto.approverId, [APPROVER_ROLE]);
      const existing = await tx.dueDiligenceApproval.findFirst({
        where: { dueDiligenceId: diligenceId, approverId: dto.approverId, status: 'pending' },
      });
      if (existing) return existing;

      const approval = await tx.dueDiligenceApproval.create({
        data: {
          dueDiligenceId: diligenceId,
          approverId: dto.approverId,
          approverRole: APPROVER_ROLE,
          level: dto.level || 1,
          status: 'pending',
        },
      });
      await tx.dueDiligenceAuditLog.create({
        data: {
          action: 'APPROVER_ASSIGNED',
          entity: 'DueDiligenceApproval',
          entityId: approval.id,
          actorId,
          dueDiligenceId: diligenceId,
          newValue: jsonValue({ approverId: dto.approverId, level: approval.level }),
        },
      });
      return approval;
    });
  }

  async decideInvestmentApproval(diligenceId: string, approvalId: string, actorId: string, dto: InvestmentDecisionDto) {
    this.ensureDatabase();
    if (dto.reason.trim().length < 3) throw new BadRequestException('A decision reason of at least 3 characters is required');
    return this.prisma.$transaction(async (tx) => {
      const [diligence, approval, actor] = await Promise.all([
        tx.dueDiligence.findUnique({
          where: { id: diligenceId },
          select: {
            id: true,
            title: true,
            status: true,
            projectId: true,
            items: { select: { status: true } },
            documents: { select: { status: true } },
          },
        }),
        tx.dueDiligenceApproval.findUnique({ where: { id: approvalId } }),
        tx.user.findUnique({
          where: { id: actorId },
          select: { isActive: true, roles: { select: { name: true } } },
        }),
      ]);
      if (!diligence) throw new NotFoundException('Due diligence case not found');
      if (!approval || approval.dueDiligenceId !== diligenceId) throw new NotFoundException('Investment approval not found');
      if (!actor?.isActive || !actor.roles.some((role) => role.name === APPROVER_ROLE)) {
        throw new ForbiddenException('An active investment-approver role is required');
      }
      if (approval.approverId !== actorId) throw new ForbiddenException('This decision is assigned to another approver');
      if (approval.status !== 'pending') throw new ConflictException('This approval has already been decided');
      if (['approved', 'rejected', 'completed'].includes(diligence.status)) {
        throw new ConflictException('A final investment decision has already been recorded for this case');
      }
      if (dto.decision === 'approved') {
        const incompleteItems = diligence.items.filter((item) => item.status !== COMPLETED_ITEM_STATUS).length;
        const unreviewedDocuments = diligence.documents.filter((document) => document.status !== 'approved').length;
        if (!diligence.items.length || incompleteItems || unreviewedDocuments) {
          throw new ConflictException(
            `Approval is blocked: ${incompleteItems} checklist item(s) and ${unreviewedDocuments} document(s) remain incomplete or unapproved.`,
          );
        }
      }

      const nextDiligenceStatus = dto.decision === 'approved'
        ? 'approved'
        : dto.decision === 'rejected'
          ? 'rejected'
          : 'in_progress';
      const nextProjectStatus = dto.decision === 'approved'
        ? 'development'
        : dto.decision === 'rejected'
          ? 'rejected'
          : 'information_requested';
      const approvalStatus = dto.decision === 'return_for_information' ? 'return_for_information' : dto.decision;
      const now = new Date();
      const approvalClaim = await tx.dueDiligenceApproval.updateMany({
        where: { id: approvalId, status: 'pending', approverId: actorId },
        data: {
          status: approvalStatus,
          approvedAt: now,
          approvalNotes: dto.reason.trim(),
        },
      });
      if (approvalClaim.count !== 1) throw new ConflictException('This approval has already been decided');
      const diligenceClaim = await tx.dueDiligence.updateMany({
        where: { id: diligenceId, status: { notIn: ['approved', 'rejected', 'completed'] } },
        data: {
          status: nextDiligenceStatus,
          ...(dto.decision === 'approved' || dto.decision === 'rejected' ? { completedAt: now } : { completedAt: null }),
        },
      });
      if (diligenceClaim.count !== 1) throw new ConflictException('A final investment decision has already been recorded for this case');
      if (diligence.projectId) {
        const project = await tx.project.findUnique({
          where: { id: diligence.projectId },
          select: { id: true, status: true },
        });
        if (!project) throw new ConflictException('Linked project no longer exists; decision was not recorded');
        await tx.project.update({ where: { id: project.id }, data: { status: nextProjectStatus } });
        await tx.projectAuditLog.create({
          data: {
            action: `DILIGENCE_${dto.decision.toUpperCase()}`,
            actorId,
            projectId: project.id,
            reason: dto.reason.trim(),
            oldValue: jsonValue({ status: project.status, diligenceStatus: diligence.status }),
            newValue: jsonValue({ status: nextProjectStatus, diligenceStatus: nextDiligenceStatus }),
          },
        });
      }
      await tx.dueDiligenceAuditLog.create({
        data: {
          action: `INVESTMENT_${dto.decision.toUpperCase()}`,
          entity: 'DueDiligenceApproval',
          entityId: approvalId,
          actorId,
          dueDiligenceId: diligenceId,
          reason: dto.reason.trim(),
          oldValue: jsonValue({ status: approval.status, diligenceStatus: diligence.status }),
          newValue: jsonValue({ status: approvalStatus, diligenceStatus: nextDiligenceStatus }),
        },
      });
      return tx.dueDiligenceApproval.findUnique({ where: { id: approvalId } });
    });
  }

  async listAuditHistory(query: AdminListQueryDto) {
    this.ensureDatabase();
    const { page, limit, skip } = normalizePage(query.page, query.limit);
    const take = skip + limit;
    const [projects, projectCount, diligence, diligenceCount, access, accessCount] = await Promise.all([
      this.prisma.projectAuditLog.findMany({
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          oldValue: true,
          newValue: true,
          reason: true,
          createdAt: true,
          project: { select: { id: true, title: true } },
          actor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.projectAuditLog.count(),
      this.prisma.dueDiligenceAuditLog.findMany({
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          reason: true,
          createdAt: true,
          dueDiligence: { select: { id: true, title: true } },
          actor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.dueDiligenceAuditLog.count(),
      this.prisma.adminAuditLog.findMany({
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          oldValue: true,
          newValue: true,
          reason: true,
          createdAt: true,
          subjectUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          actor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.adminAuditLog.count(),
    ]);
    const entries = [
      ...projects.map((entry) => ({ ...entry, recordType: 'project', record: entry.project })),
      ...diligence.map((entry) => ({ ...entry, recordType: 'due-diligence', record: entry.dueDiligence })),
      ...access.map((entry) => ({ ...entry, recordType: 'user-access', record: entry.subjectUser })),
    ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()).slice(skip, skip + limit);
    return { data: entries, total: projectCount + diligenceCount + accessCount, page, limit };
  }

  private async assertEligibleUser(
    tx: Prisma.TransactionClient,
    userId: string,
    allowedRoles: string[],
  ) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, roles: { select: { name: true } } },
    });
    if (!user || !user.isActive) throw new BadRequestException('Selected user is not an active account');
    if (!user.roles.some((role) => allowedRoles.includes(role.name))) {
      throw new BadRequestException(`Selected user must have one of these roles: ${allowedRoles.join(', ')}`);
    }
  }

  private ensureDatabase() {
    if (!this.prisma.isDatabaseAvailable()) {
      throw new ServiceUnavailableException('Administrative operations are unavailable while the database is offline.');
    }
  }
}
