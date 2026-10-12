import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

const ACCOUNT_TYPES = ['COMMUNITY_MEMBER', 'INVESTOR', 'FACILITY_OPERATOR', 'GUEST'] as const;

export class AdminListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  accountType?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class AssignReviewerDto {
  @IsOptional()
  @IsString()
  reviewerId?: string | null;

  @IsString()
  @MinLength(3)
  reason!: string;
}

export class ProjectScreeningDecisionDto {
  @IsIn(['approve', 'reject', 'return_for_information'])
  decision!: 'approve' | 'reject' | 'return_for_information';

  @IsString()
  @MinLength(3)
  reason!: string;
}

export class CreateDiligenceFromProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class CreateInvestmentApprovalDto {
  @IsString()
  approverId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level = 1;
}

export class InvestmentDecisionDto {
  @IsIn(['approved', 'rejected', 'return_for_information'])
  decision!: 'approved' | 'rejected' | 'return_for_information';

  @IsString()
  @MinLength(3)
  reason!: string;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsIn(ACCOUNT_TYPES)
  accountType?: typeof ACCOUNT_TYPES[number];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @IsString()
  @MinLength(3)
  reason!: string;
}

