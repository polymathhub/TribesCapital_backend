import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateCourseDto, UpdateCourseDto, CourseResponseDto, EnrollmentResponseDto } from './dto/course.dto';
import { calculateProgressPercent } from '@modules/lessons/progress.utils';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(instructorId: string, createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
    const course = await this.prisma.course.create({
      data: {
        title: createCourseDto.title,
        description: createCourseDto.description || '',
        thumbnail: createCourseDto.thumbnail,
        category: createCourseDto.categoryId || 'general',
        level: createCourseDto.difficulty || 'beginner',
        duration: createCourseDto.duration || 0,
        isPublished: createCourseDto.isPublished || false,
        creatorId: instructorId,
        instructorId: instructorId,
      },
      include: {
        lessons: true,
        enrollments: true,
      },
    });

    return this.formatCourseResponse(course);
  }

  async findAll(skip: number = 0, take: number = 10): Promise<CourseResponseDto[]> {
    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      skip,
      take,
      include: {
        lessons: true,
        enrollments: true,
      },
    });

    return courses.map(course => this.formatCourseResponse(course));
  }

  async findById(id: string): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        enrollments: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.formatCourseResponse(course);
  }

  async update(id: string, instructorId: string, updateCourseDto: UpdateCourseDto): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('Cannot update course');
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
      include: {
        lessons: true,
        enrollments: true,
      },
    });

    return this.formatCourseResponse(updated);
  }

  async enroll(courseId: string, userId: string): Promise<EnrollmentResponseDto> {
    const enrollment = await this.prisma.enrollment.create({
      data: {
        courseId,
        userId,
      },
    });

    return {
      id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      status: enrollment.status,
      progress: 0,
      startDate: enrollment.enrolledAt,
      createdAt: enrollment.createdAt,
    };
  }

  async getEnrollments(userId: string): Promise<EnrollmentResponseDto[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: true,
          },
        },
      },
    });

    return enrollments.map((e) => {
      const progress = Number(e.progress ?? 0);
      const normalizedStatus = progress >= 100 ? 'completed' : progress > 0 ? 'inProgress' : 'notStarted';
      return {
        id: e.id,
        userId: e.userId,
        courseId: e.courseId,
        status: normalizedStatus,
        progress,
        startDate: e.enrolledAt,
        createdAt: e.createdAt,
      };
    });
  }

  async getProgress(courseId: string, userId: string): Promise<{ progress: number; status: string; completedLessons: number; totalLessons: number; lastLessonId: string | null; lastAccessedAt: string | null }> {
    const totalLessons = await this.prisma.lesson.count({ where: { courseId } });
    const completedLessons = await this.prisma.progress.count({
      where: {
        userId,
        completedAt: { not: null },
        lesson: { courseId },
      },
    });
    const latestProgress = await this.prisma.progress.findFirst({
      where: {
        userId,
        lesson: { courseId },
      },
      orderBy: { lastAccessedAt: 'desc' },
      select: {
        lessonId: true,
        lastAccessedAt: true,
      },
    });
    const progress = calculateProgressPercent(completedLessons, totalLessons);
    return {
      progress,
      status: progress >= 100 ? 'completed' : progress > 0 ? 'inProgress' : 'notStarted',
      completedLessons,
      totalLessons,
      lastLessonId: latestProgress?.lessonId ?? null,
      lastAccessedAt: latestProgress?.lastAccessedAt ? latestProgress.lastAccessedAt.toISOString() : null,
    };
  }

  private formatCourseResponse(course: any): CourseResponseDto {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      thumbnail: course.thumbnail,
      difficulty: course.difficulty,
      duration: course.duration,
      price: course.price,
      isPublished: course.isPublished,
      instructorId: course.instructorId,
      lessons: course.lessons?.length || 0,
      enrollments: course.enrollments?.length || 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
