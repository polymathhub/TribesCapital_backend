import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/event.dto';

describe('EventsService', () => {
  it('creates new events as pending approval', async () => {
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
          isPublished: false,
          creatorId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          rsvps: [],
        }),
      },
    };

    const notificationsService = {
      createForAllUsers: jest.fn().mockResolvedValue({ count: 1 }),
    };

    const service = new EventsService(prisma as any, notificationsService as any);

    await service.create('user-1', {
      title: 'Launch Session',
      slug: 'launch-session',
      startDate: '2026-01-01T10:00:00.000Z',
      endDate: '2026-01-01T11:00:00.000Z',
    } as any);

    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPublished: false,
          creatorId: 'user-1',
        }),
      }),
    );
    expect(notificationsService.createForAllUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'event_created',
        title: 'New office hours event created',
        actorId: 'user-1',
      }),
    );
  });

  it('approves a pending event by publishing it', async () => {
    const prisma = {
      event: {
        findUnique: jest.fn().mockResolvedValue({ id: 'event-1', isPublished: false, rsvps: [] }),
        update: jest.fn().mockResolvedValue({
          id: 'event-1',
          title: 'Working Session',
          slug: 'working-session',
          startDate: new Date('2026-01-01T10:00:00.000Z'),
          endDate: new Date('2026-01-01T11:00:00.000Z'),
          capacity: 10,
          rsvps: [],
          isPublished: false,
        }),
      },
    };

    const service = new EventsService(prisma as any);

    await service.approve('event-1');

    expect(prisma.event.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'event-1' },
      data: { isPublished: true },
    }));
  });

  it('rejects invalid RSVP guest counts before creating a reservation', async () => {
    const prisma = {
      event: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'event-1',
          title: 'Lunch and Learn',
          capacity: 10,
          rsvps: [{ guestCount: 1 }],
        }),
      },
      rSVP: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const service = new EventsService(prisma as any);

    await expect(service.createRsvp('event-1', 'user-1', { guestCount: 0 } as any)).rejects.toThrow('Guest count must be between 1 and 10');
    expect(prisma.rSVP.findUnique).not.toHaveBeenCalled();
  });

  it('rejects zero-capacity events from the request payload', async () => {
    const dto = plainToInstance(CreateEventDto, {
      title: 'Working Session',
      startDate: '2026-01-01T10:00:00.000Z',
      endDate: '2026-01-01T11:00:00.000Z',
      capacity: 0,
    });

    const errors = await validate(dto);

    expect(errors.some(error => error.property === 'capacity')).toBe(true);
  });
});
