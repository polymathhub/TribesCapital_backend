import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, HttpCode } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, EventResponseDto, RsvpResponseDto, CreateRsvpDto } from './dto/event.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { Public } from '@common/decorators/public.decorator';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Public()
  @Get()
  async findAll(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 10,
  ): Promise<EventResponseDto[]> {
    return this.eventsService.findAll(skip, take);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string): Promise<EventResponseDto> {
    return this.eventsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @GetCurrentUser('id') userId: string,
    @Body() createEventDto: CreateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.create(userId, createEventDto);
  }

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async createRsvp(
    @Param('id') eventId: string,
    @GetCurrentUser('id') userId: string,
    @Body() createRsvpDto: CreateRsvpDto,
  ): Promise<RsvpResponseDto> {
    return this.eventsService.createRsvp(eventId, userId, createRsvpDto);
  }

  @Delete(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  async cancelRsvp(
    @Param('id') eventId: string,
    @GetCurrentUser('id') userId: string,
  ): Promise<void> {
    await this.eventsService.cancelRsvp(eventId, userId);
  }

  @Get(':id/rsvps')
  @UseGuards(JwtAuthGuard)
  async getRsvps(@Param('id') eventId: string): Promise<RsvpResponseDto[]> {
    return this.eventsService.getRsvps(eventId);
  }
}
