import { IsString, IsOptional, IsDateString, IsNumber, IsBoolean } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  slug!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  meetingPlatform?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  meetingHandle?: string;

  @IsOptional()
  @IsString()
  meetingInstructions?: string;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;
}

export class CreateRsvpDto {
  @IsNumber()
  guestCount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class EventResponseDto {
  id!: string;
  title!: string;
  description?: string;
  slug!: string;
  startDate!: Date;
  endDate!: Date;
  location?: string;
  isVirtual!: boolean;
  eventType?: string;
  meetingPlatform?: string;
  meetingLink?: string;
  meetingHandle?: string;
  meetingInstructions?: string;
  registrationDeadline?: Date;
  capacity?: number;
  rsvpCount!: number;
  organizerId!: string;
  isPublished!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class RsvpResponseDto {
  id!: string;
  userId!: string;
  eventId!: string;
  status!: string;
  guestCount!: number;
  notes?: string;
  rsvpedAt!: Date;
}
