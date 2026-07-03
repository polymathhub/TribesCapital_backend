import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

export interface VideoWatchEvent {
  userId: string;
  videoId: string;
  courseId: string;
  lessonId: string;
  watchDuration: number; // seconds
  totalDuration: number; // seconds
  percentageWatched: number;
  isCompleted: boolean;
  timestamp: Date;
}

@Injectable()
export class VideoTrackingService {
  private readonly logger = new Logger(VideoTrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Track video watch event
   * Records when a user watches a video lesson and persists analytics
   */
  async trackVideoWatch(userId: string, data: {
    videoId: string;
    courseId: string;
    lessonId: string;
    watchDuration: number;
    totalDuration: number;
    percentageWatched: number;
    isCompleted: boolean;
  }): Promise<any> {
    const timestamp = new Date();
    const eventData = {
      ...data,
      timestamp,
    };

    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventName: 'lesson.watch',
          eventData,
          metadata: {
            courseId: data.courseId,
            lessonId: data.lessonId,
            videoId: data.videoId,
            isCompleted: data.isCompleted,
          },
          userId,
        },
      });
    } catch (error) {
      this.logger.warn('Unable to record lesson watch event in analytics table', error);
    }

    if (data.isCompleted || data.percentageWatched >= 95) {
      try {
        await this.prisma.progress.upsert({
          where: {
            userId_lessonId: {
              userId,
              lessonId: data.lessonId,
            },
          },
          create: {
            userId,
            lessonId: data.lessonId,
            completionPercentage: 100,
            completedAt: timestamp,
            lastAccessedAt: timestamp,
          },
          update: {
            completionPercentage: 100,
            completedAt: timestamp,
            lastAccessedAt: timestamp,
          },
        });
      } catch (error) {
        this.logger.warn('Unable to update lesson progress for completed watch event', error);
      }
    }

    const engagementScore = this.calculateEngagementScore(data.percentageWatched, data.isCompleted);

    return {
      success: true,
      message: 'Video watch tracked successfully',
      data: {
        userId,
        ...data,
        timestamp,
        engagementScore,
      },
    };
  }

  /**
   * Get watch history for a user's course lessons.
   */
  async getWatchHistory(userId: string, courseId?: string): Promise<VideoWatchEvent[]> {
    try {
      const events = await this.prisma.analyticsEvent.findMany({
        where: {
          userId,
          eventName: 'lesson.watch',
          metadata: courseId ? { path: ['courseId'], equals: courseId } : undefined,
        },
        orderBy: { createdAt: 'desc' },
      });

      return events.map((event) => {
        const payload = (event.eventData ?? {}) as Record<string, any>;
        return {
          userId,
          videoId: payload.videoId ?? '',
          courseId: payload.courseId ?? '',
          lessonId: payload.lessonId ?? '',
          watchDuration: Number(payload.watchDuration ?? 0),
          totalDuration: Number(payload.totalDuration ?? 0),
          percentageWatched: Number(payload.percentageWatched ?? 0),
          isCompleted: Boolean(payload.isCompleted),
          timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
        };
      });
    } catch (error) {
      this.logger.warn('Unable to load video watch history', error);
      return [];
    }
  }

  async getCourseAnalytics(userId: string, courseId: string): Promise<any> {
    try {
      const events = await this.prisma.analyticsEvent.findMany({
        where: {
          userId,
          eventName: 'lesson.watch',
          metadata: { path: ['courseId'], equals: courseId },
        },
      });

      const progressEntries = await this.prisma.progress.findMany({
        where: {
          userId,
          lesson: {
            courseId,
          },
        },
      });

      const totalWatchTime = events.reduce((sum, event) => {
        const payload = (event.eventData ?? {}) as Record<string, any>;
        return sum + Number(payload.watchDuration ?? 0);
      }, 0);
      const averageCompletion = events.length
        ? Math.round(events.reduce((sum, event) => {
            const payload = (event.eventData ?? {}) as Record<string, any>;
            return sum + Number(payload.percentageWatched ?? 0);
          }, 0) / events.length)
        : 0;
      const uniqueLessons = new Set(events.map((event) => {
        const payload = (event.eventData ?? {}) as Record<string, any>;
        return payload.lessonId;
      }));
      const lastWatchedEvent = events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      return {
        userId,
        courseId,
        totalLessonsWatched: uniqueLessons.size,
        completedLessons: progressEntries.filter((item) => item.completedAt !== null).length,
        totalWatchTime,
        averageCompletion,
        lastWatchedLesson: ((lastWatchedEvent?.eventData ?? {}) as Record<string, any>).lessonId || null,
      };
    } catch (error) {
      this.logger.warn('Unable to build course video analytics', error);
      return {
        userId,
        courseId,
        totalLessonsWatched: 0,
        completedLessons: 0,
        totalWatchTime: 0,
        averageCompletion: 0,
        lastWatchedLesson: null,
      };
    }
  }

  /**
   * Calculate engagement score based on watch percentage and completion
   */
  private calculateEngagementScore(percentageWatched: number, isCompleted: boolean): number {
    let score = percentageWatched;
    if (isCompleted) {
      score = Math.max(score, 100); // Ensure completed videos show 100%
    }
    return Math.min(score, 100);
  }
}
