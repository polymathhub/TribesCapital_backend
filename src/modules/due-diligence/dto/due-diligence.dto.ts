import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsJSON,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

/* ════════════════════════════════════════════════════════════ */
/*             DUE DILIGENCE - DTOs (Enterprise)                */
/* ════════════════════════════════════════════════════════════ */

export enum DDType {
  INVESTMENT = 'investment',
  COMPLIANCE = 'compliance',
  COMPANY = 'company',
  FUND = 'fund',
}

export enum DDStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum DDPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  BLOCKED = 'blocked',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/* ─── Create Due Diligence ─── */
export class CreateDueDiligenceDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DDType)
  @IsOptional()
  type?: DDType = DDType.INVESTMENT;

  @IsString()
  targetName!: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsJSON()
  targetMetadata?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  targetDeadline?: string;

  @IsEnum(DDPriority)
  @IsOptional()
  priority?: DDPriority = DDPriority.MEDIUM;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

/* ─── Update Due Diligence ─── */
export class UpdateDueDiligenceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DDStatus)
  status?: DDStatus;

  @IsOptional()
  @IsEnum(DDPriority)
  priority?: DDPriority;

  @IsOptional()
  @IsDateString()
  targetDeadline?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  score?: number;

  @IsOptional()
  @IsString()
  recommendation?: string;

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

/* ─── Due Diligence Item ─── */
export class CreateDDItemDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category!: string;

  @IsEnum(DDPriority)
  @IsOptional()
  priority?: DDPriority = DDPriority.MEDIUM;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxScore?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(1)
  weightage?: number = 1.0;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class UpdateDDItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  score?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  evidence?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

/* ─── Document Management ─── */
export class CreateDDDocumentDto {
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  tags?: string[] | string;
}

export class ReviewDDDocumentDto {
  @IsString()
  reviewNotes!: string;

  @IsEnum(['approved', 'rejected', 'revise_needed'])
  status!: string;
}

/* ─── Comments & Collaboration ─── */
export class CreateDDCommentDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

/* ─── Approvals ─── */
export class CreateDDApprovalDto {
  @IsString()
  approverRole!: string;

  @IsOptional()
  @IsUUID()
  approverId?: string;

  @IsOptional()
  @IsNumber()
  level?: number = 1;
}

export class ApproveDDDto {
  @IsEnum(['approved', 'rejected'])
  status!: string;

  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

/* ─── Query DTOs ─── */
export class QueryDDDto {
  @IsOptional()
  @IsEnum(DDStatus)
  status?: DDStatus;

  @IsOptional()
  @IsEnum(DDType)
  type?: DDType;

  @IsOptional()
  @IsEnum(DDPriority)
  priority?: DDPriority;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/* ─── Response DTOs ─── */
export class DueDiligenceResponseDto {
  id!: string;
  title!: string;
  description?: string;
  type!: DDType;
  status!: DDStatus;
  priority!: DDPriority;
  completionPercent!: number;
  score?: number;
  riskLevel?: RiskLevel;
  recommendation?: string;
  targetName!: string;
  targetType?: string;
  startDate!: Date;
  targetDeadline?: Date;
  completedAt?: Date;
  creator!: { id: string; email: string; name: string };
  assignedTo?: { id: string; email: string; name: string };
  itemCount!: number;
  documentCount!: number;
  pendingApprovals!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class DDItemResponseDto {
  id!: string;
  title!: string;
  description?: string;
  category!: string;
  priority!: DDPriority;
  status!: ItemStatus;
  score?: number;
  weightage!: number;
  notes?: string;
  evidence?: string;
  dueDate?: Date;
  completedAt?: Date;
  assignedTo?: { id: string; email: string; name: string };
  createdAt!: Date;
  updatedAt!: Date;
}

export class DueDiligenceDetailDto extends DueDiligenceResponseDto {
  items!: DDItemResponseDto[];
  documents!: any[];
  commentCount!: number;
  auditLogCount!: number;
}
