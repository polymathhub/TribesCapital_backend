import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '@database/prisma.service';

describe('AnalyticsService admin report', () => {
  const createService = (databaseAvailable = true) => {
    const queryResults = [
      [{ bucket: new Date('2026-10-01T00:00:00.000Z'), count: 2 }],
      [{ bucket: new Date('2026-10-01T00:00:00.000Z'), registrations: 3, learning: 4, community: 5 }],
      [{ type: 'Webinar', count: 6 }],
      [{ category: 'Solar', count: 7 }],
      [{ category: 'Solar', count: 8 }],
      [{ occurredAt: new Date('2026-10-02T00:00:00.000Z'), kind: 'signup', label: 'New member joined' }],
      [{ count: 9 }],
      [{ value: 'Solar' }],
      [{ value: 'Webinar' }],
    ];
    const prisma = {
      isDatabaseAvailable: jest.fn().mockReturnValue(databaseAvailable),
      user: { count: jest.fn().mockResolvedValueOnce(100).mockResolvedValueOnce(10).mockResolvedValueOnce(5) },
      course: { count: jest.fn().mockResolvedValue(12) },
      event: { count: jest.fn().mockResolvedValue(13) },
      $queryRaw: jest.fn().mockImplementation(() => Promise.resolve(queryResults.shift() || [])),
    };

    return { service: new AnalyticsService(prisma as unknown as PrismaService), prisma };
  };

  it('returns real aggregate series and period comparisons', async () => {
    const { service } = createService();

    const report = await service.getAdminReport({ range: '30d', contentType: 'Solar', eventType: 'Webinar' });

    expect(report.kpis).toEqual({
      members: 100,
      newSignups: 10,
      signupChange: 100,
      activeUsers: 9,
      eventRegistrations: 6,
      publishedCourses: 12,
      publishedEvents: 13,
    });
    expect(report.userGrowth).toEqual([{ date: '2026-10-01T00:00:00.000Z', count: 2 }]);
    expect(report.engagement).toEqual([{
      date: '2026-10-01T00:00:00.000Z',
      registrations: 3,
      learning: 4,
      community: 5,
    }]);
    expect(report.eventAttendance).toEqual([{ type: 'Webinar', count: 6 }]);
    expect(report.filters).toEqual({ contentTypes: ['Solar'], eventTypes: ['Webinar'] });
  });

  it('rejects unsupported and malformed custom ranges', async () => {
    const { service } = createService();

    await expect(service.getAdminReport({ range: 'all-time' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.getAdminReport({ range: 'custom', from: '2026-10-01', to: 'not-a-date' }))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(service.getAdminReport({ range: 'custom', from: '2026-10-02', to: '2026-10-01' }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('fails explicitly when analytics storage is unavailable', async () => {
    const { service } = createService(false);

    await expect(service.getAdminReport({ range: '30d' })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
