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
