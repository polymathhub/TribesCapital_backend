import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { LessonsService } from './lessons.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  LessonResponseDto,
} from './dto/lesson.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { Public } from '@common/decorators/public.decorator';

@Controller('lessons')
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Post('courses/:courseId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('video'))
  async createLesson(
    @Param('courseId') courseId: string,
    @GetCurrentUser('id') userId: string,
    @Body() createLessonDto: CreateLessonDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<LessonResponseDto> {
    return this.lessonsService.createLesson(
      courseId,
      userId,
      createLessonDto,
      file,
    );
  }

  @Public()
  @Get('courses/:courseId')
  async getLessonsByCourse(
    @Param('courseId') courseId: string,
  ): Promise<LessonResponseDto[]> {
    return this.lessonsService.getLessonsByCourse(courseId);
  }

  @Public()
  @Get(':id')
  async getLessonById(@Param('id') id: string): Promise<LessonResponseDto> {
    return this.lessonsService.getLessonById(id);
  }

  @Public()
  @Get(':id/video-url')
  async getVideoUrl(@Param('id') lessonId: string): Promise<{ url: string }> {
    return this.lessonsService.getVideoUrl(lessonId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('video'))
  async updateLesson(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<LessonResponseDto> {
    return this.lessonsService.updateLesson(id, userId, updateLessonDto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteLesson(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.lessonsService.deleteLesson(id, userId);
    return { message: 'Lesson deleted successfully' };
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  async markLessonComplete(
    @Param('id') lessonId: string,
    @GetCurrentUser('id') userId: string,
  ): Promise<LessonResponseDto> {
    return this.lessonsService.markLessonComplete(lessonId, userId);
  }

  @Post('youtube-proxy/:videoId')
  async getYouTubeProxy(
    @Param('videoId') videoId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Return alternative YouTube CDN URLs
      const response = {
        videoId,
        embedUrls: [
          `https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&controls=1&rel=0&fs=1`,
          `https://youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&controls=1&rel=0&fs=1`,
          `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&modestbranding=1&controls=1&rel=0&fs=1`,
        ],
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnails: {
          default: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
          medium: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
          high: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          standard: `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
          maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        },
        timestamp: new Date(),
      };
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process YouTube video' });
    }
  }

  @Post('track/watch')
  @UseGuards(JwtAuthGuard)
  async trackVideoWatch(
    @GetCurrentUser('id') userId: string,
    @Body() trackingData: {
      videoId: string;
      courseId: string;
      lessonId: string;
      watchDuration: number;
      totalDuration: number;
      percentageWatched: number;
      isCompleted: boolean;
    },
  ): Promise<any> {
    // In production, use VideoTrackingService
    console.log(`📹 Video Watch Tracked - User: ${userId}, Video: ${trackingData.videoId}, Progress: ${trackingData.percentageWatched}%`);
    
    return {
      success: true,
      message: 'Video watch tracked successfully',
      data: {
        userId,
        ...trackingData,
        timestamp: new Date(),
      },
    };
  }

  @Get('track/analytics/:courseId')
  @UseGuards(JwtAuthGuard)
  async getVideoAnalytics(
    @GetCurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
  ): Promise<any> {
    return {
      userId,
      courseId,
      totalLessons: 7,
      completedLessons: 0,
      totalWatchTime: 0,
      averageEngagement: 0,
      lastWatchedLesson: null,
    };
  }
}
