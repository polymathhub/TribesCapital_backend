import { IsArray, IsIn, IsNumber, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export const PROJECT_STATUSES = ['scoping', 'due-diligence', 'development', 'operational'] as const;
export const PROJECT_TYPES = ['Solar', 'Solar PV', 'C&I Solar', 'Mini-grid', 'Storage', 'Battery Storage', 'Wind', 'Hydro'] as const;

export type ProjectFile = { fileName: string; mimeType: string; size: number; storageKey: string; url: string };

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(PROJECT_TYPES)
  projectType?: typeof PROJECT_TYPES[number];

  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: typeof PROJECT_STATUSES[number];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  capacityKwp?: number;

  @IsOptional()
  @IsString()
  managingContractor?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  pipelineMetadata?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  attachments?: ProjectFile[];
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(PROJECT_TYPES)
  projectType?: typeof PROJECT_TYPES[number];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  capacityKwp?: number;

  @IsOptional()
  @IsString()
  managingContractor?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  pipelineMetadata?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  attachments?: ProjectFile[];
}

export class UpdateProjectStatusDto {
  @IsIn(PROJECT_STATUSES)
  status!: typeof PROJECT_STATUSES[number];
}