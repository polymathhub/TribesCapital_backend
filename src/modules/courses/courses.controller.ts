import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CourseResponseDto, EnrollmentDto, EnrollmentResponseDto } from './dto/course.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

const normalizePagination = (value: number | string | undefined, fallback: number, maximum?: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.max(Math.floor(parsed), 0);
  return maximum === undefined ? normalized : Math.min(normalized, maximum);
};

@Controller('courses')
@ApiTags('Courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Public()
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<CourseResponseDto[]> {
    return this.coursesService.findAll(normalizePagination(skip, 0), normalizePagination(take, 10, 100));
  }

  @Get('enrolled')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getEnrolled(@GetCurrentUser('id') userId: string): Promise<EnrollmentResponseDto[]> {
    return this.coursesService.getEnrollments(userId);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string): Promise<CourseResponseDto> {
    return this.coursesService.findById(id);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProgress(
    @Param('id') courseId: string,
    @GetCurrentUser('id') userId: string,
  ): Promise<{ progress: number; status: string; completedLessons: number; totalLessons: number; lastLessonId: string | null; lastAccessedAt: string | null }> {
    return this.coursesService.getProgress(courseId, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('admin')
  async create(
    @GetCurrentUser('id') userId: string,
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.create(userId, createCourseDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.update(id, userId, updateCourseDto);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async enroll(
    @Param('id') courseId: string,
    @GetCurrentUser('id') userId: string,
  ): Promise<EnrollmentResponseDto> {
    return this.coursesService.enroll(courseId, userId);
  }

  @Get(':userId/enrollments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getEnrollments(@Param('userId') userId: string): Promise<EnrollmentResponseDto[]> {
    return this.coursesService.getEnrollments(userId);
  }
}
