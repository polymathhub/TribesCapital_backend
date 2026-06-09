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

    // In production, you would save this to a database
    // For now, log the event
    console.log('📹 Video Watch Event:', event);

    // Calculate engagement metrics
    const engagementScore = this.calculateEngagementScore(data.percentageWatched, data.isCompleted);
    
    return {
      ...event,
      percentageWatched: engagementScore,
    };
  }

  /**
   * Get video watch history for a user
   */
  async getWatchHistory(userId: string, courseId?: string): Promise<VideoWatchEvent[]> {
    // In production, query the database
    // For now, return empty array
    return [];
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
    return {
      totalVideosWatched: 0,
      totalWatchTime: 0,
      averageCompletion: 0,
      engagementTrend: 0,
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
