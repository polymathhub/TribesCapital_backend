import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export const LEAD_STATUSES = [
  'draft',
  'submitted',
  'in_review',
  'information_requested',
  'accepted',
  'declined',
  'duplicate',
  'parked',
] as const;

export class CreateLeadDraftDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class UpdateLeadDraftDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(7)
  step?: number;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class SubmitLeadDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class SendLeadMagicLinkDto {
  @IsEmail()
  email!: string;
}

export class AdminLeadListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: typeof LEAD_STATUSES[number];

  @IsOptional()
  @IsIn(['partner', 'introducer', 'direct', 'inbound'])
  channel?: 'partner' | 'introducer' | 'direct' | 'inbound';

  @IsOptional()
  @IsString()
  countryCode?: string;
}

export class AssignLeadReviewerDto {
  @IsOptional()
  @IsString()
  reviewerId?: string | null;

  @IsString()
  @MinLength(3)
  reason!: string;
}

export class TransitionLeadDto {
  @IsIn(LEAD_STATUSES)
  status!: typeof LEAD_STATUSES[number];

  @IsString()
  @MinLength(3)
  reason!: string;
}
