import { IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  email!: string;
  firstName!: string;
  lastName!: string;
  password!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;
  @IsOptional()
  @IsString()
  lastName?: string;
  @IsOptional()
  @IsString()
  avatar?: string;
  @IsOptional()
  @IsString()
  bio?: string;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  avatar?: string;
  bio?: string;
  isActive!: boolean;
  createdAt!: Date;
}
