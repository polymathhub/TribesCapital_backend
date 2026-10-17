import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';

type AdminReportQuery = {
  range?: string;
  from?: string;
  to?: string;
  contentType?: string;
  eventType?: string;
};

type DateBucketRow = { bucket: Date; count: number };

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    if (!this.prisma.isDatabaseAvailable()) {
      throw new ServiceUnavailableException('Dashboard data is unavailable while the database is offline.');
    }

    const [members, activeDiscussions, upcomingEvents, publishedCourses] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.communityPost.count(),
      this.prisma.event.count({ where: { isPublished: true, startDate: { gte: new Date() } } }),
      this.prisma.course.count({ where: { isPublished: true } }),
    ]);

    return { members, activeDiscussions, upcomingEvents, publishedCourses };
  }

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

  async getAdminReport(query: AdminReportQuery) {
    if (!this.prisma.isDatabaseAvailable()) {
      throw new ServiceUnavailableException('Analytics data is unavailable while the database is offline.');
    }

    const range = query.range || '30d';
    const validRanges = ['7d', '30d', '90d', '12mo', 'custom'];
    if (!validRanges.includes(range)) {
      throw new BadRequestException('Choose a supported analytics date range.');
    }

    const now = new Date();
    let start: Date;
    let end: Date;
    if (range === 'custom') {
      if (!this.isDateOnly(query.from) || !this.isDateOnly(query.to)) {
        throw new BadRequestException('Custom ranges require valid from and to dates in YYYY-MM-DD format.');
      }
      start = new Date(`${query.from}T00:00:00.000Z`);
      end = new Date(`${query.to}T00:00:00.000Z`);
      if (start > end) {
        throw new BadRequestException('The start date must be on or before the end date.');
      }
      end.setUTCDate(end.getUTCDate() + 1);
    } else {
      end = now;
      start = new Date(now);
      if (range === '12mo') start.setUTCMonth(start.getUTCMonth() - 12);
      else start.setUTCDate(start.getUTCDate() - Number(range.slice(0, -1)));
    }

    const duration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - duration);
    const granularity = duration <= 31 * 24 * 60 * 60 * 1000 ? 'day' : duration <= 120 * 24 * 60 * 60 * 1000 ? 'week' : 'month';
    const contentType = query.contentType?.trim() || undefined;
    const eventType = query.eventType?.trim() || undefined;
    const contentFilter = contentType
      ? Prisma.sql`AND c."category" = ${contentType}`
      : Prisma.empty;
    const eventFilter = eventType
      ? Prisma.sql`AND e."eventType" = ${eventType}`
      : Prisma.empty;

    const [members, newSignups, previousSignups, publishedCourses, publishedEvents, userGrowth, engagement, eventAttendance, contentDistribution, resourcePerformance, recentActivity, activeUsers, contentTypes, eventTypes] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
      this.prisma.user.count({ where: { createdAt: { gte: previousStart, lt: start } } }),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.event.count({ where: { isPublished: true } }),
      this.prisma.$queryRaw<DateBucketRow[]>(Prisma.sql`
        SELECT date_trunc(${granularity}, "createdAt") AS bucket, COUNT(*)::int AS count
        FROM "User"
        WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
        GROUP BY bucket
        ORDER BY bucket
      `),
      this.prisma.$queryRaw<Array<{ bucket: Date; registrations: number; learning: number; community: number }>>(Prisma.sql`
        SELECT bucket, SUM(registrations)::int AS registrations, SUM(learning)::int AS learning, SUM(community)::int AS community
        FROM (
          SELECT date_trunc(${granularity}, r."rsvpedAt") AS bucket, COUNT(*)::int AS registrations, 0::int AS learning, 0::int AS community
          FROM "RSVP" r
          INNER JOIN "Event" e ON e."id" = r."eventId"
          WHERE r."rsvpedAt" >= ${start} AND r."rsvpedAt" < ${end} AND r."cancelledAt" IS NULL AND r."status" = 'attending' AND e."isPublished" = true ${eventFilter}
          GROUP BY bucket
          UNION ALL
          SELECT date_trunc(${granularity}, p."lastAccessedAt") AS bucket, 0::int AS registrations, COUNT(*)::int AS learning, 0::int AS community
          FROM "Progress" p
          INNER JOIN "Lesson" l ON l."id" = p."lessonId"
          INNER JOIN "Course" c ON c."id" = l."courseId"
          WHERE p."lastAccessedAt" >= ${start} AND p."lastAccessedAt" < ${end} AND l."isPublished" = true AND c."isPublished" = true ${contentFilter}
          GROUP BY bucket
          UNION ALL
          SELECT date_trunc(${granularity}, cp."createdAt") AS bucket, 0::int AS registrations, 0::int AS learning, COUNT(*)::int AS community
          FROM "CommunityPost" cp
          WHERE cp."createdAt" >= ${start} AND cp."createdAt" < ${end}
          GROUP BY bucket
          UNION ALL
          SELECT date_trunc(${granularity}, cc."createdAt") AS bucket, 0::int AS registrations, 0::int AS learning, COUNT(*)::int AS community
          FROM "CommunityComment" cc
          WHERE cc."createdAt" >= ${start} AND cc."createdAt" < ${end}
          GROUP BY bucket
        ) activity
        GROUP BY bucket
        ORDER BY bucket
      `),
      this.prisma.$queryRaw<Array<{ type: string; count: number }>>(Prisma.sql`
        SELECT COALESCE(e."eventType", 'Other') AS type, SUM(r."guestCount")::int AS count
        FROM "RSVP" r
        INNER JOIN "Event" e ON e."id" = r."eventId"
        WHERE r."rsvpedAt" >= ${start} AND r."rsvpedAt" < ${end} AND r."cancelledAt" IS NULL AND r."status" = 'attending' AND e."isPublished" = true ${eventFilter}
        GROUP BY type ORDER BY count DESC, type
      `),
      this.prisma.$queryRaw<Array<{ category: string; count: number }>>(Prisma.sql`
        SELECT COALESCE(c."category", 'Uncategorized') AS category, COUNT(*)::int AS count
        FROM "Course" c
        WHERE c."isPublished" = true ${contentFilter}
        GROUP BY category ORDER BY count DESC, category
      `),
      this.prisma.$queryRaw<Array<{ category: string; count: number }>>(Prisma.sql`
        SELECT COALESCE(c."category", 'Uncategorized') AS category, COUNT(*)::int AS count
        FROM "Progress" p
        INNER JOIN "Lesson" l ON l."id" = p."lessonId"
        INNER JOIN "Course" c ON c."id" = l."courseId"
        WHERE p."lastAccessedAt" >= ${start} AND p."lastAccessedAt" < ${end} AND l."isPublished" = true AND c."isPublished" = true ${contentFilter}
        GROUP BY category ORDER BY count DESC, category
      `),
      this.prisma.$queryRaw<Array<{ occurredAt: Date; kind: string; label: string }>>(Prisma.sql`
        SELECT "createdAt" AS "occurredAt", 'signup' AS kind, 'New member joined' AS label
        FROM "User" WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
        UNION ALL
        SELECT p."lastAccessedAt" AS "occurredAt", 'learning' AS kind, 'Lesson activity recorded' AS label
        FROM "Progress" p INNER JOIN "Lesson" l ON l."id" = p."lessonId" INNER JOIN "Course" c ON c."id" = l."courseId"
        WHERE p."lastAccessedAt" >= ${start} AND p."lastAccessedAt" < ${end} AND l."isPublished" = true AND c."isPublished" = true ${contentFilter}
        UNION ALL
        SELECT r."rsvpedAt" AS "occurredAt", 'event' AS kind, 'Event registration received' AS label
        FROM "RSVP" r INNER JOIN "Event" e ON e."id" = r."eventId"
        WHERE r."rsvpedAt" >= ${start} AND r."rsvpedAt" < ${end} AND r."cancelledAt" IS NULL AND r."status" = 'attending' AND e."isPublished" = true ${eventFilter}
        UNION ALL
        SELECT cp."createdAt" AS "occurredAt", 'community' AS kind, 'Community post created' AS label
        FROM "CommunityPost" cp WHERE cp."createdAt" >= ${start} AND cp."createdAt" < ${end}
        ORDER BY "occurredAt" DESC LIMIT 8
      `),
      this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
        SELECT COUNT(DISTINCT active."userId")::int AS count
        FROM (
          SELECT p."userId" FROM "Progress" p WHERE p."lastAccessedAt" >= ${start} AND p."lastAccessedAt" < ${end}
          UNION SELECT r."userId" FROM "RSVP" r WHERE r."rsvpedAt" >= ${start} AND r."rsvpedAt" < ${end} AND r."cancelledAt" IS NULL AND r."status" = 'attending'
          UNION SELECT cp."creatorId" AS "userId" FROM "CommunityPost" cp WHERE cp."createdAt" >= ${start} AND cp."createdAt" < ${end}
          UNION SELECT cc."creatorId" AS "userId" FROM "CommunityComment" cc WHERE cc."createdAt" >= ${start} AND cc."createdAt" < ${end}
        ) active
      `),
      this.prisma.$queryRaw<Array<{ value: string }>>(Prisma.sql`SELECT DISTINCT "category" AS value FROM "Course" WHERE "isPublished" = true AND "category" IS NOT NULL ORDER BY value`),
      this.prisma.$queryRaw<Array<{ value: string }>>(Prisma.sql`SELECT DISTINCT "eventType" AS value FROM "Event" WHERE "isPublished" = true AND "eventType" IS NOT NULL ORDER BY value`),
    ]);

    return {
      range: { from: start.toISOString(), to: new Date(end.getTime() - 1).toISOString(), granularity },
      kpis: {
        members,
        newSignups,
        signupChange: previousSignups === 0 ? null : Math.round(((newSignups - previousSignups) / previousSignups) * 100),
        activeUsers: Number(activeUsers[0]?.count || 0),
        eventRegistrations: eventAttendance.reduce((total, item) => total + Number(item.count), 0),
        publishedCourses,
        publishedEvents,
      },
      userGrowth: userGrowth.map(item => ({ date: item.bucket.toISOString(), count: Number(item.count) })),
      engagement: engagement.map(item => ({
        date: item.bucket.toISOString(),
        registrations: Number(item.registrations),
        learning: Number(item.learning),
        community: Number(item.community),
      })),
      eventAttendance: eventAttendance.map(item => ({ type: item.type, count: Number(item.count) })),
      contentDistribution: contentDistribution.map(item => ({ category: item.category, count: Number(item.count) })),
      resourcePerformance: resourcePerformance.map(item => ({ category: item.category, count: Number(item.count) })),
      recentActivity: recentActivity.map(item => ({ ...item, occurredAt: item.occurredAt.toISOString() })),
      filters: { contentTypes: contentTypes.map(item => item.value), eventTypes: eventTypes.map(item => item.value) },
    };
  }

  private isDateOnly(value?: string): value is string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
}
