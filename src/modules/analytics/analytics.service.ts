import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminOverview() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [members, newSignups, publishedVideos, announcementGroups, publishedCourses, publishedEvents, pendingEvents] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.lesson.count({
        where: {
          videoUrl: { not: null },
          course: { isPublished: true },
        },
      }),
      this.prisma.notification.groupBy({
        by: ['title'],
        where: {
          type: 'announcement',
          createdAt: { gte: since },
        },
      }),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.event.count({ where: { isPublished: true } }),
      this.prisma.event.count({ where: { isPublished: false } }),
    ]);

    return {
      members,
      newSignups,
      publishedVideos,
      announcementUpdates: announcementGroups.length,
      publishedCourses,
      publishedEvents,
      pendingEvents,
      periodDays: 30,
    };
  }
}
