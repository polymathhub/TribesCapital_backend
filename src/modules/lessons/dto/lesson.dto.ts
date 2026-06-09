import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;
}

export class LessonResponseDto {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  videoUrl?: string;
  order: number;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LessonWithVideoUrlDto extends LessonResponseDto {
  signedVideoUrl?: string;
}
