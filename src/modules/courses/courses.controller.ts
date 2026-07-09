import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CourseResponseDto, EnrollmentDto, EnrollmentResponseDto } from './dto/course.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { Public } from '@common/decorators/public.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Public()
  @Get()
  async findAll(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<CourseResponseDto[]> {
    return this.coursesService.findAll(skip, take);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string): Promise<CourseResponseDto> {
    return this.coursesService.findById(id);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  async getProgress(
    @Param('id') courseId: string,
    @GetCurrentUser('id') userId: string,
  ): Promise<{ progress: number; status: string; completedLessons: number; totalLessons: number }> {
    return this.coursesService.getProgress(courseId, userId);
  }

  @Get('enrolled')
  @UseGuards(JwtAuthGuard)
  async getEnrolled(@GetCurrentUser('id') userId: string): Promise<EnrollmentResponseDto[]> {
    return this.coursesService.getEnrollments(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @GetCurrentUser('id') userId: string,
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.create(userId, createCourseDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.update(id, userId, updateCourseDto);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async enroll(
    @Param('id') courseId: string,
    @GetCurrentUser('id') userId: string,
  ): Promise<EnrollmentResponseDto> {
    return this.coursesService.enroll(courseId, userId);
  }

  @Get(':userId/enrollments')
  @UseGuards(JwtAuthGuard)
  async getEnrollments(@Param('userId') userId: string): Promise<CourseResponseDto[]> {
    return this.coursesService.getEnrollments(userId);
  }
}
