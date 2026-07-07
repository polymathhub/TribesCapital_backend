import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateCourseDto, UpdateCourseDto, CourseResponseDto, EnrollmentResponseDto } from './dto/course.dto';

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
        enrollments: false,
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

  async getEnrollments(userId: string): Promise<CourseResponseDto[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    return enrollments.map(e => this.formatCourseResponse(e.course));
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
