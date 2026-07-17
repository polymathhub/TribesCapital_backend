import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import {
  CreateDueDiligenceDto,
  UpdateDueDiligenceDto,
  CreateDDItemDto,
  UpdateDDItemDto,
  CreateDDDocumentDto,
  ReviewDDDocumentDto,
  CreateDDCommentDto,
  CreateDDApprovalDto,
  ApproveDDDto,
  QueryDDDto,
  DDStatus,
  ItemStatus,
} from './dto/due-diligence.dto';

function inferDocumentType(originalname: string, mimetype: string) {
  const ext = originalname.split('.').pop()?.toLowerCase();
  if (ext) {
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'zip', 'rar'].includes(ext)) {
      return ext;
    }
  }
  if (mimetype.includes('pdf')) return 'pdf';
  if (mimetype.includes('word')) return 'word';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'excel';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'other';
}

@Injectable()
export class DueDiligenceService {
  constructor(private prisma: PrismaService) {}

  /* ═══════════════════════════════════════════════════════════ */
  /*                   DUE DILIGENCE CRUD                        */
  /* ═══════════════════════════════════════════════════════════ */

  async create(dto: CreateDueDiligenceDto, userId: string) {
    const payload = {
      title: dto.title,
      description: dto.description || '',
      type: dto.type || 'investment',
      targetName: dto.targetName,
      targetType: dto.targetType || 'company',
      targetMetadata: dto.targetMetadata || {},
      priority: dto.priority || 'medium',
      creatorId: userId,
      assignedToId: dto.assignedToId || null,
      targetDeadline: dto.targetDeadline ? new Date(dto.targetDeadline) : null,
      status: 'draft' as const,
      completionPercent: 0,
      score: 0,
      recommendation: null,
      riskLevel: 'low' as const,
    };

    return this.prisma.dueDiligence.create({
      data: payload,
      include: {
        creator: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: true,
        documents: true,
        _count: {
          select: { items: true, documents: true, comments: true, approvals: true },
        },
      },
    });
  }

  async findAll(query: QueryDDDto, userId: string) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const skip = (page - 1) * limit;
    const where: any = {
      OR: [{ creatorId: userId }, { assignedToId: userId }],
    };

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.priority) where.priority = query.priority;
    if (query.search) {
      where.OR.push(
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { targetName: { contains: query.search, mode: 'insensitive' } },
      );
    }

    const [data, total] = await Promise.all([
      this.prisma.dueDiligence.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          assignedTo: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          documents: true,
          _count: {
            select: { items: true, documents: true, comments: true, approvals: true },
          },
        },
      }),
      this.prisma.dueDiligence.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const dd = await this.prisma.dueDiligence.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        items: {
          include: {
            assignedTo: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
        documents: {
          include: {
            uploadedBy: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
            reviewedBy: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
        _count: {
          select: { items: true, documents: true, comments: true, auditLogs: true },
        },
      },
    });

    if (!dd) throw new NotFoundException('Due diligence not found');
    this.assertAccess(dd, userId);
    return dd;
  }

  async update(id: string, dto: UpdateDueDiligenceDto, userId: string) {
    const dd = await this.findOne(id, userId);
    this.assertOwner(dd, userId);

    await this.logAudit(id, userId, 'UPDATE', 'DueDiligence', id, dd, dto);

    return this.prisma.dueDiligence.update({
      where: { id },
      data: {
        ...dto,
        targetDeadline: dto.targetDeadline ? new Date(dto.targetDeadline) : undefined,
      },
      include: { creator: true, assignedTo: true, _count: { select: { items: true } } },
    });
  }

  async delete(id: string, userId: string) {
    const dd = await this.findOne(id, userId);
    this.assertOwner(dd, userId);

    await this.logAudit(id, userId, 'DELETE', 'DueDiligence', id, dd, null);

    return this.prisma.dueDiligence.delete({ where: { id } });
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               DUE DILIGENCE ITEMS MANAGEMENT                */
  /* ═══════════════════════════════════════════════════════════ */

  async createItem(dueDiligenceId: string, dto: CreateDDItemDto, userId: string) {
    const dd = await this.findOne(dueDiligenceId, userId);

    const item = await this.prisma.dueDiligenceItem.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority || 'medium',
        maxScore: dto.maxScore || 10,
        weightage: dto.weightage || 1.0,
        dueDiligenceId,
        assignedToId: dto.assignedToId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        assignedTo: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    await this.logAudit(dueDiligenceId, userId, 'CREATE_ITEM', 'DueDiligenceItem', item.id, null, item);
    await this.recalculateCompletion(dueDiligenceId);
    return item;
  }

  async updateItem(dueDiligenceId: string, itemId: string, dto: UpdateDDItemDto, userId: string) {
    const dd = await this.findOne(dueDiligenceId, userId);
    const item = await this.prisma.dueDiligenceItem.findUnique({ where: { id: itemId } });
    if (!item || item.dueDiligenceId !== dueDiligenceId) throw new NotFoundException('Item not found');

    await this.logAudit(dueDiligenceId, userId, 'UPDATE_ITEM', 'DueDiligenceItem', itemId, item, dto);

    const updated = await this.prisma.dueDiligenceItem.update({
      where: { id: itemId },
      data: {
        ...dto,
        completedAt: dto.status === 'completed' ? new Date() : item.completedAt,
      },
      include: {
        assignedTo: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    await this.recalculateCompletion(dueDiligenceId);
    return updated;
  }

  async deleteItem(dueDiligenceId: string, itemId: string, userId: string) {
    const dd = await this.findOne(dueDiligenceId, userId);
    const item = await this.prisma.dueDiligenceItem.findUnique({ where: { id: itemId } });
    if (!item || item.dueDiligenceId !== dueDiligenceId) throw new NotFoundException('Item not found');

    await this.logAudit(dueDiligenceId, userId, 'DELETE_ITEM', 'DueDiligenceItem', itemId, item, null);
    await this.prisma.dueDiligenceItem.delete({ where: { id: itemId } });
    await this.recalculateCompletion(dueDiligenceId);
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               DOCUMENT MANAGEMENT                           */
  /* ═══════════════════════════════════════════════════════════ */

  async uploadDocument(dueDiligenceId: string, dto: CreateDDDocumentDto, userId: string) {
    const dd = await this.findOne(dueDiligenceId, userId);

    const fileName = dto.fileName || dto.fileUrl?.split('/').pop()?.split('?')[0] || 'document';
    const fileType = dto.fileType || inferDocumentType(fileName, dto.fileUrl || '');
    const fileUrl = dto.fileUrl || '';
    const fileSize = dto.fileSize ?? 0;
    const tags = Array.isArray(dto.tags)
      ? dto.tags
      : typeof dto.tags === 'string'
      ? dto.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

    const doc = await this.prisma.dueDiligenceDocument.create({
      data: {
        fileName,
        fileUrl,
        fileType,
        fileSize,
        category: dto.category,
        description: dto.description,
        tags,
        uploadedById: userId,
        dueDiligenceId,
      },
      include: {
        uploadedBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    await this.logAudit(dueDiligenceId, userId, 'UPLOAD_DOCUMENT', 'DueDiligenceDocument', doc.id, null, doc);
    return doc;
  }

  async deleteDocument(dueDiligenceId: string, docId: string, userId: string) {
    const dd = await this.findOne(dueDiligenceId, userId);
    const doc = await this.prisma.dueDiligenceDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.dueDiligenceId !== dueDiligenceId) throw new NotFoundException('Document not found');

    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), doc.fileUrl.replace(/^[\\/]/, ''));
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }

    await this.logAudit(dueDiligenceId, userId, 'DELETE_DOCUMENT', 'DueDiligenceDocument', doc.id, doc, null);
    await this.prisma.dueDiligenceDocument.delete({ where: { id: docId } });
  }

  async reviewDocument(dueDiligenceId: string, docId: string, dto: ReviewDDDocumentDto, userId: string) {
    const dd = await this.findOne(dueDiligenceId, userId);
    const doc = await this.prisma.dueDiligenceDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.dueDiligenceId !== dueDiligenceId) throw new NotFoundException('Document not found');

    const updated = await this.prisma.dueDiligenceDocument.update({
      where: { id: docId },
      data: {
        status: dto.status,
        reviewedById: userId,
        reviewedAt: new Date(),
        reviewNotes: dto.reviewNotes,
      },
      include: {
        uploadedBy: true,
        reviewedBy: true,
      },
    });

    await this.logAudit(dueDiligenceId, userId, 'REVIEW_DOCUMENT', 'DueDiligenceDocument', docId, doc, updated);
    return updated;
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               COMMENTS & COLLABORATION                      */
  /* ═══════════════════════════════════════════════════════════ */

  async addComment(dueDiligenceId: string, dto: CreateDDCommentDto, userId: string) {
    const dd = await this.findOne(dueDiligenceId, userId);

    const comment = await this.prisma.dueDiligenceComment.create({
      data: {
        content: dto.content,
        mentions: dto.mentions || [],
        attachments: dto.attachments || [],
        authorId: userId,
        parentId: dto.parentId,
        dueDiligenceId,
      },
      include: {
        author: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    await this.logAudit(dueDiligenceId, userId, 'ADD_COMMENT', 'DueDiligenceComment', comment.id, null, comment);
    return comment;
  }

  async deleteComment(dueDiligenceId: string, commentId: string, userId: string) {
    const dd = await this.findOne(dueDiligenceId, userId);
    const comment = await this.prisma.dueDiligenceComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.dueDiligenceId !== dueDiligenceId) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId && dd.creatorId !== userId) {
      throw new ForbiddenException('Only the comment author or diligence owner can delete this comment');
    }

    await this.logAudit(dueDiligenceId, userId, 'DELETE_COMMENT', 'DueDiligenceComment', commentId, comment, null);
    return this.prisma.dueDiligenceComment.delete({ where: { id: commentId } });
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               APPROVAL WORKFLOW                             */
  /* ═══════════════════════════════════════════════════════════ */

  async createApproval(dueDiligenceId: string, dto: CreateDDApprovalDto, userId: string) {
    const dd = await this.findOne(dueDiligenceId, userId);

    return this.prisma.dueDiligenceApproval.create({
      data: {
        approverRole: dto.approverRole,
        approverId: dto.approverId,
        level: dto.level || 1,
        dueDiligenceId,
      },
      include: {
        approver: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async approveOrReject(dueDiligenceId: string, approvalId: string, dto: ApproveDDDto, userId: string) {
    const dd = await this.findOne(dueDiligenceId, userId);
    const approval = await this.prisma.dueDiligenceApproval.findUnique({ where: { id: approvalId } });
    if (!approval) throw new NotFoundException('Approval not found');

    const updated = await this.prisma.dueDiligenceApproval.update({
      where: { id: approvalId },
      data: {
        status: dto.status,
        approverId: userId,
        approvedAt: new Date(),
        approvalNotes: dto.approvalNotes,
      },
    });

    if (dto.status === 'approved') {
      const pendingApprovals = await this.prisma.dueDiligenceApproval.count({
        where: { dueDiligenceId, status: 'pending' },
      });

      if (pendingApprovals === 0) {
        await this.update(dueDiligenceId, { status: DDStatus.APPROVED }, userId);
      }
    }

    await this.logAudit(dueDiligenceId, userId, 'APPROVE_REJECT', 'DueDiligenceApproval', approvalId, approval, updated);
    return updated;
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               HELPERS & UTILITIES                           */
  /* ═══════════════════════════════════════════════════════════ */

  private async recalculateCompletion(dueDiligenceId: string) {
    const items = await this.prisma.dueDiligenceItem.findMany({
      where: { dueDiligenceId },
      select: { score: true, maxScore: true, status: true },
    });

    if (items.length === 0) return;

    const completed = items.filter((i) => i.status === 'completed').length;
    const completionPercent = Math.round((completed / items.length) * 100);

    let totalScore = 0;
    let maxScore = 0;
    items.forEach((item) => {
      if (item.score !== null) totalScore += item.score;
      if (item.maxScore) maxScore += item.maxScore;
    });

    const score = maxScore > 0 ? parseFloat((totalScore / maxScore * 10).toFixed(2)) : undefined;

    await this.prisma.dueDiligence.update({
      where: { id: dueDiligenceId },
      data: { completionPercent, score },
    });
  }

  private async logAudit(
    dueDiligenceId: string,
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    oldValue: any,
    newValue: any,
  ) {
    await this.prisma.dueDiligenceAuditLog.create({
      data: {
        action,
        entity,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
        actorId: userId,
        dueDiligenceId,
      },
    });
  }

  private assertAccess(dd: any, userId: string) {
    const hasAccess = dd.creatorId === userId || dd.assignedToId === userId;
    if (!hasAccess) throw new ForbiddenException('Access denied');
  }

  private assertOwner(dd: any, userId: string) {
    if (dd.creatorId !== userId) throw new ForbiddenException('Only owner can modify');
  }
}
