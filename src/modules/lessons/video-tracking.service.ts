import { Injectable } from '@nestjs/common';
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
  constructor(private prisma: PrismaService) {}

  /**
   * Track video watch event
   * Records when a user watches a video lesson
   */
  async trackVideoWatch(userId: string, data: {
    videoId: string;
    courseId: string;
    lessonId: string;
    watchDuration: number;
    totalDuration: number;
    percentageWatched: number;
    isCompleted: boolean;
  }): Promise<VideoWatchEvent> {
    const event: VideoWatchEvent = {
      userId,
      ...data,
      timestamp: new Date(),
    };

    const completionPercentage = this.calculateEngagementScore(data.percentageWatched, data.isCompleted);

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
        completionPercentage,
        completedAt: data.isCompleted ? new Date() : null,
        lastAccessedAt: new Date(),
      },
      update: {
        completionPercentage,
        completedAt: data.isCompleted ? new Date() : undefined,
        lastAccessedAt: new Date(),
      },
    });

    return {
      ...event,
      percentageWatched: completionPercentage,
    };
  }

  /**
   * Get video watch history for a user
   */
  async getWatchHistory(userId: string, courseId?: string): Promise<VideoWatchEvent[]> {
    const progressEntries = await this.prisma.progress.findMany({
      where: {
        userId,
        ...(courseId ? { lesson: { courseId } } : {}),
      },
      select: {
        lessonId: true,
        completionPercentage: true,
        completedAt: true,
        lastAccessedAt: true,
      },
      orderBy: { lastAccessedAt: 'asc' },
    });

    return progressEntries.map(entry => ({
      userId,
      videoId: entry.lessonId,
      courseId: courseId || '',
      lessonId: entry.lessonId,
      watchDuration: entry.completionPercentage ? Math.round((entry.completionPercentage / 100) * 1800) : 0,
      totalDuration: 1800,
      percentageWatched: entry.completionPercentage,
      isCompleted: Boolean(entry.completedAt),
      timestamp: entry.lastAccessedAt,
    }));
  }

  /**
   * Get video engagement analytics
   */
  async getEngagementAnalytics(userId: string): Promise<{
    totalVideosWatched: number;
    totalWatchTime: number;
    averageCompletion: number;
    engagementTrend: number;
  }> {
    const progressEntries = await this.prisma.progress.findMany({
      where: { userId },
      select: { completionPercentage: true, lastAccessedAt: true },
    });

    const totalVideosWatched = progressEntries.length;
    const totalWatchTime = progressEntries.reduce((sum, entry) => sum + Math.round((entry.completionPercentage / 100) * 1800), 0);
    const averageCompletion = totalVideosWatched > 0 ? Math.round(progressEntries.reduce((sum, entry) => sum + entry.completionPercentage, 0) / totalVideosWatched) : 0;

    return {
      totalVideosWatched,
      totalWatchTime,
      averageCompletion,
      engagementTrend: averageCompletion,
    };
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
