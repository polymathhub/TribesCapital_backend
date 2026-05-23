import { IsString, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AssignRoleDto {
  @IsString()
  userId: string;

  @IsString()
  roleId: string;
}

export class CreatePermissionDto {
  @IsString()
  name: string;

  @IsString()
  resource: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  description?: string;
}
