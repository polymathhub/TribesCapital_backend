import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  email!: string;
  firstName!: string;
  lastName!: string;
  password!: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: ['COMMUNITY_MEMBER', 'INVESTOR', 'FACILITY_OPERATOR', 'GUEST'] })
  @IsOptional()
  @IsIn(['COMMUNITY_MEMBER', 'INVESTOR', 'FACILITY_OPERATOR', 'GUEST'])
  accountType?: string;
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  displayName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;
  @ApiPropertyOptional({ description: 'Profile image data URL or stored image URL.' })
  @IsOptional()
  @IsString()
  avatar?: string;
  @ApiPropertyOptional({ description: 'Cover image data URL or stored image URL. Image uploads are limited to 5 MB.' })
  @IsOptional()
  @IsString()
  coverPhoto?: string | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  address?: string;
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation?: string;
  @ApiPropertyOptional({ type: [String], maxItems: 30 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  interests?: string[];
  @ApiPropertyOptional({ maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  socialLink?: string;
  @ApiPropertyOptional({ type: [String], maxItems: 8 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(240, { each: true })
  socialLinks?: string[];
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  email!: string;
  @ApiProperty()
  firstName!: string;
  @ApiProperty()
  lastName!: string;
  @ApiPropertyOptional({ description: 'Profile image URL or data URL.' })
  avatar?: string;
  @ApiPropertyOptional({ description: 'Cover image URL or data URL.' })
  coverPhoto?: string;
  @ApiPropertyOptional()
  bio?: string;
  @ApiPropertyOptional()
  address?: string;
  @ApiPropertyOptional()
  occupation?: string;
  @ApiPropertyOptional({ type: [String] })
  interests?: string[];
  @ApiPropertyOptional()
  socialLink?: string;
  @ApiPropertyOptional({ type: [String] })
  socialLinks?: string[];
  @ApiProperty()
  isActive!: boolean;
  @ApiProperty()
  createdAt!: Date;
  @ApiPropertyOptional({ enum: ['COMMUNITY_MEMBER', 'INVESTOR', 'FACILITY_OPERATOR', 'GUEST'] })
  accountType?: string;
}
