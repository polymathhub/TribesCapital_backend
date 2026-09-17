import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConversationType, MessageType } from '@prisma/client';

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type!: ConversationType;

  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @IsOptional()
  participantIds?: string[];

  @IsString()
  @MaxLength(160)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  dueDiligenceId?: string;

  @IsString()
  @MaxLength(160)
  @IsOptional()
  channelName?: string;

  @IsBoolean()
  @IsOptional()
  isPrivateChannel?: boolean;
}

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsString()
  @IsOptional()
  replyToId?: string;

  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsOptional()
  mentions?: string[];

  @IsArray()
  @ArrayMaxSize(10)
  @IsOptional()
  @Type(() => AttachmentMetadataDto)
  @ValidateNested({ each: true })
  attachments?: AttachmentMetadataDto[];
}

export class AttachmentMetadataDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MaxLength(120)
  mimeType!: string;

  @IsInt()
  @Min(0)
  @Max(25 * 1024 * 1024)
  size!: number;

  @IsString()
  @MaxLength(500)
  storageKey!: string;

  @IsString()
  @MaxLength(1000)
  url!: string;
}

export class UpdateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;
}

export class ReactionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  reaction!: string;
}

export class ReportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  reason!: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  details?: string;
}

export class MessageSearchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  query!: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

export class ReadMessagesDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @IsOptional()
  messageIds!: string[];
}
