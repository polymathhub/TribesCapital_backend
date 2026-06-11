import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class CourseResponseDto {
  id!: string;
  title!: string;
  description?: string;
  slug!: string;
  thumbnail?: string;
  difficulty!: string;
  duration?: number;
  price!: number;
  isPublished!: boolean;
  instructorId!: string;
  lessons!: number;
  enrollments!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class EnrollmentDto {
  courseId!: string;
}

export class EnrollmentResponseDto {
  id!: string;
  userId!: string;
  courseId!: string;
  status!: string;
  progress!: number;
  startDate?: Date;
  createdAt!: Date;
}
