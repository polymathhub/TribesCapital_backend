import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateLessonDto, UpdateLessonDto, LessonResponseDto } from './dto/lesson.dto';
import { VideoService } from './video.service';

@Injectable()
export class LessonsService {
  constructor(
    private prisma: PrismaService,
    private videoService: VideoService,
  ) {}

  async createLesson(
    courseId: string,
    userId: string,
    createLessonDto: CreateLessonDto,
    videoFile?: Express.Multer.File,
  ): Promise<LessonResponseDto> {
    // Verify course exists and user is instructor
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.instructorId !== userId) {
      throw new NotFoundException('Course not found or unauthorized');
    }

    let videoUrl: string | null = null;
    if (videoFile) {
      videoUrl = await this.videoService.uploadVideo(videoFile, courseId);
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        title: createLessonDto.title,
        description: createLessonDto.description,
        content: '',
        duration: createLessonDto.duration || 0,
        videoUrl,
        courseId,
        order: createLessonDto.order || 1,
        creatorId: userId,
      },
    });

    return this.formatLesson(lesson);
  }

  async getLessonsByCourse(courseId: string): Promise<LessonResponseDto[]> {
    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });

    return lessons.map(l => this.formatLesson(l));
  }

  async getLessonById(id: string): Promise<LessonResponseDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return this.formatLesson(lesson);
  }

  async getVideoUrl(lessonId: string): Promise<{ url: string }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { videoUrl: true },
    });

    if (!lesson || !lesson.videoUrl) {
      throw new NotFoundException('Video not found for this lesson');
    }

    // Generate signed URL if using S3
    const signedUrl = await this.videoService.getSignedUrl(lesson.videoUrl);
    return { url: signedUrl };
  }

  async updateLesson(
    id: string,
    userId: string,
    updateLessonDto: UpdateLessonDto,
    videoFile?: Express.Multer.File,
  ): Promise<LessonResponseDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lesson || lesson.course.instructorId !== userId) {
      throw new NotFoundException('Lesson not found or unauthorized');
    }

    let videoUrl = lesson.videoUrl;
    if (videoFile) {
      // Delete old video if exists
      if (lesson.videoUrl) {
        await this.videoService.deleteVideo(lesson.videoUrl);
      }
      videoUrl = await this.videoService.uploadVideo(
        videoFile,
        lesson.courseId,
      );
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: {
        title: updateLessonDto.title || lesson.title,
        description: updateLessonDto.description || lesson.description,
        duration: updateLessonDto.duration || lesson.duration,
        videoUrl,
      },
    });

    return this.formatLesson(updated);
  }

  async deleteLesson(id: string, userId: string): Promise<void> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!lesson || lesson.course.instructorId !== userId) {
      throw new NotFoundException('Lesson not found or unauthorized');
    }

    // Delete video from S3
    if (lesson.videoUrl) {
      await this.videoService.deleteVideo(lesson.videoUrl);
    }

    await this.prisma.lesson.delete({
      where: { id },
    });
  }

  async markLessonComplete(
    lessonId: string,
    userId: string,
  ): Promise<LessonResponseDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        completionPercentage: 100,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
      update: {
        completionPercentage: 100,
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });

    await this.prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.courseId,
        },
      },
      create: {
        userId,
        courseId: lesson.courseId,
      },
      update: {},
    });

    return this.formatLesson(lesson);
  }

  async getCourseProgress(userId: string, courseId: string): Promise<{ totalLessons: number; completedLessons: number }> {
    const [lessonCount, completedCount] = await Promise.all([
      this.prisma.lesson.count({ where: { courseId } }),
      this.prisma.progress.count({
        where: {
          userId,
          lesson: { courseId },
          completedAt: { not: null },
        },
      }),
    ]);

    return {
      totalLessons: lessonCount,
      completedLessons: completedCount,
    };
  }

  private formatLesson(lesson: any): LessonResponseDto {
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
      videoUrl: lesson.videoUrl,
      order: lesson.order,
      courseId: lesson.courseId,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };
  }
}
