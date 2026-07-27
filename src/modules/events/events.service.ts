import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { inMemoryFallbackStore } from '@common/services/in-memory-fallback.store';
import { CreateEventDto, EventResponseDto, RsvpResponseDto, CreateRsvpDto } from './dto/event.dto';

function slugify(value: string): string {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  private isDatabaseUnavailable(error?: any): boolean {
    const message = error?.message || '';
    return Boolean(
      error && (
        message.includes('P1001') ||
        message.includes("Can't reach database") ||
        message.includes('connect ECONNREFUSED') ||
        message.includes('database server')
      ),
    );
  }

  async create(organizerId: string, createEventDto: CreateEventDto): Promise<EventResponseDto> {
    const eventData: any = {
      title: createEventDto.title,
      slug: createEventDto.slug || slugify(createEventDto.title),
      description: createEventDto.description || '',
      location: createEventDto.location || (createEventDto.isVirtual ? 'Virtual' : 'TBD'),
      isVirtual: Boolean(createEventDto.isVirtual || createEventDto.meetingPlatform || createEventDto.meetingLink),
      meetingPlatform: createEventDto.meetingPlatform || null,
      meetingLink: createEventDto.meetingLink || null,
      meetingHandle: createEventDto.meetingHandle || createEventDto.meetingLink || null,
      meetingInstructions: createEventDto.meetingInstructions || null,
      startDate: new Date(createEventDto.startDate),
      endDate: new Date(createEventDto.endDate),
      capacity: createEventDto.capacity || 100,
      isPublished: true,
      creatorId: organizerId,
    };

    if (createEventDto.registrationDeadline) {
      eventData.registrationDeadline = new Date(createEventDto.registrationDeadline);
    }

    if (createEventDto.eventType) {
      eventData.eventType = createEventDto.eventType;
    }

    try {
      const event = await this.prisma.event.create({
        data: eventData,
        include: {
          rsvps: true,
        },
      });

      return this.formatEventResponse(event);
    } catch (error) {
      if (this.isDatabaseUnavailable(error)) {
        const fallbackEvent = inMemoryFallbackStore.createEvent(eventData, organizerId);
        return this.formatEventResponse({ ...fallbackEvent, rsvps: [] });
      }
      throw error;
    }
  }

  async findAll(skip: number = 0, take: number = 10): Promise<EventResponseDto[]> {
    try {
      const events = await this.prisma.event.findMany({
        where: { isPublished: true },
        skip,
        take,
        include: {
          rsvps: true,
        },
      });

      return events.map(event => this.formatEventResponse(event));
    } catch (error) {
      if (this.isDatabaseUnavailable(error)) {
        return inMemoryFallbackStore.listEvents(skip, take).map(event => this.formatEventResponse(event));
      }
      throw error;
    }
  }

  async findById(id: string): Promise<EventResponseDto> {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id },
        include: {
          rsvps: true,
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      return this.formatEventResponse(event);
    } catch (error) {
      if (this.isDatabaseUnavailable(error)) {
        const fallbackEvent = inMemoryFallbackStore.getEvent(id);
        if (!fallbackEvent) {
          throw new NotFoundException('Event not found');
        }
        return this.formatEventResponse({ ...fallbackEvent, rsvps: fallbackEvent.rsvps });
      }
      throw error;
    }
  }

  async createRsvp(eventId: string, userId: string, createRsvpDto: CreateRsvpDto): Promise<RsvpResponseDto> {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: { rsvps: true },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const existingRsvp = await this.prisma.rSVP.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });

      if (existingRsvp) {
        throw new ConflictException('Already RSVP\'d to this event');
      }

      if (event.capacity) {
        const totalRsvps = event.rsvps.reduce((sum, r) => sum + r.guestCount, 0);

        if (totalRsvps + createRsvpDto.guestCount > event.capacity) {
          throw new BadRequestException('Event capacity exceeded');
        }
      }

      const rsvp = await this.prisma.rSVP.create({
        data: {
          userId,
          eventId,
          guestCount: createRsvpDto.guestCount,
        },
      });

      return this.formatRsvpResponse(rsvp);
    } catch (error) {
      if (this.isDatabaseUnavailable(error)) {
        const fallbackRsvp = inMemoryFallbackStore.createRsvp(eventId, userId, createRsvpDto.guestCount);
        return this.formatRsvpResponse({ ...fallbackRsvp, status: 'attending', notes: null, rsvpedAt: fallbackRsvp.createdAt });
      }
      throw error;
    }
  }

  async cancelRsvp(eventId: string, userId: string): Promise<void> {
    try {
      const rsvp = await this.prisma.rSVP.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });

      if (!rsvp) {
        throw new NotFoundException('RSVP not found');
      }

      await this.prisma.rSVP.delete({
        where: { id: rsvp.id },
      });
    } catch (error) {
      if (this.isDatabaseUnavailable(error)) {
        inMemoryFallbackStore.cancelRsvp(eventId, userId);
        return;
      }
      throw error;
    }
  }

  async getRsvps(eventId: string): Promise<RsvpResponseDto[]> {
    try {
      const rsvps = await this.prisma.rSVP.findMany({
        where: { eventId },
      });

      return rsvps.map(rsvp => this.formatRsvpResponse(rsvp));
    } catch (error) {
      if (this.isDatabaseUnavailable(error)) {
        return inMemoryFallbackStore.getRsvps(eventId).map(rsvp => this.formatRsvpResponse({ ...rsvp, status: 'attending', notes: null }));
      }
      throw error;
    }
  }

  async update(id: string, userId: string, updateEventDto: CreateEventDto): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only allow admin or event creator to update
    if (event.creatorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      });

      const isAdmin = user?.roles?.some(r => r.name === 'admin');
      if (!isAdmin) {
        throw new BadRequestException('Only admin or event creator can update events');
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        slug: updateEventDto.slug || slugify(updateEventDto.title || event.title),
        meetingPlatform: updateEventDto.meetingPlatform,
        meetingLink: updateEventDto.meetingLink,
        meetingHandle: updateEventDto.meetingHandle,
        meetingInstructions: updateEventDto.meetingInstructions,
        registrationDeadline: updateEventDto.registrationDeadline ? new Date(updateEventDto.registrationDeadline) : null,
      } as any,
      include: {
        rsvps: true,
      },
    });

    return this.formatEventResponse(updatedEvent);
  }

  async delete(id: string, userId: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only allow admin or event creator to delete
    if (event.creatorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      });

      const isAdmin = user?.roles?.some(r => r.name === 'admin');
      if (!isAdmin) {
        throw new BadRequestException('Only admin or event creator can delete events');
      }
    }

    await this.prisma.event.delete({
      where: { id },
    });
  }

  private formatEventResponse(event: any): EventResponseDto {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      slug: event.slug || slugify(event.title || ''),
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      isVirtual: event.isVirtual,
      eventType: event.eventType,
      meetingPlatform: event.meetingPlatform,
      meetingLink: event.meetingLink,
      meetingHandle: event.meetingHandle,
      meetingInstructions: event.meetingInstructions,
      registrationDeadline: event.registrationDeadline,
      capacity: event.capacity,
      rsvpCount: event.rsvps?.reduce((sum: number, r: any) => sum + r.guestCount, 0) || 0,
      organizerId: event.creatorId || event.organizerId,
      isPublished: event.isPublished,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private formatRsvpResponse(rsvp: any): RsvpResponseDto {
    return {
      id: rsvp.id,
      userId: rsvp.userId,
      eventId: rsvp.eventId,
      status: rsvp.status,
      guestCount: rsvp.guestCount,
      notes: rsvp.notes,
      rsvpedAt: rsvp.rsvpedAt,
    };
  }
}
