import { EventsService } from './events.service';

describe('EventsService', () => {
  it('publishes newly created events by default', async () => {
    const prisma = {
      event: {
        create: jest.fn().mockResolvedValue({
          id: 'event-1',
          title: 'Launch Session',
          slug: 'launch-session',
          description: 'A live session',
          startDate: new Date('2026-01-01T10:00:00.000Z'),
          endDate: new Date('2026-01-01T11:00:00.000Z'),
          location: 'Virtual',
          isVirtual: true,
          eventType: 'Office hours',
          meetingPlatform: null,
          meetingLink: null,
          meetingHandle: null,
          meetingInstructions: null,
          registrationDeadline: null,
          capacity: 100,
          isPublished: true,
          creatorId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          rsvps: [],
        }),
      },
    };

    const service = new EventsService(prisma as any);

    await service.create('user-1', {
      title: 'Launch Session',
      slug: 'launch-session',
      startDate: '2026-01-01T10:00:00.000Z',
      endDate: '2026-01-01T11:00:00.000Z',
    } as any);

    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPublished: true,
          creatorId: 'user-1',
        }),
      }),
    );
  });
});
