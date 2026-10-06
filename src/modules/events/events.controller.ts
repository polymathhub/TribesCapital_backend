import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards, HttpCode, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { Type } from 'class-transformer';
import { EventsService } from './events.service';
import { CreateEventDto, EventResponseDto, RsvpResponseDto, CreateRsvpDto } from './dto/event.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { Public } from '@common/decorators/public.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('events')
@ApiTags('Events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Public()
  @Get()
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
  ): Promise<EventResponseDto[]> {
    return this.eventsService.findAll(skip, take);
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('admin')
  async findPending(): Promise<EventResponseDto[]> {
    return this.eventsService.findPending();
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('admin')
  async approve(@Param('id') id: string): Promise<EventResponseDto> {
    return this.eventsService.approve(id);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string): Promise<EventResponseDto> {
    return this.eventsService.findById(id);
  }

  @Get(':id/rsvp-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRsvpStatus(
    @Param('id') eventId: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<{ attending: boolean }> {
    return this.eventsService.getRsvpStatus(eventId, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(
    @GetCurrentUser('sub') userId: string,
    @Body() createEventDto: CreateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.create(userId, createEventDto);
  }

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  async createRsvp(
    @Param('id') eventId: string,
    @GetCurrentUser('sub') userId: string,
    @Body() createRsvpDto: CreateRsvpDto,
  ): Promise<RsvpResponseDto> {
    return this.eventsService.createRsvp(eventId, userId, createRsvpDto);
  }

  @Delete(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async cancelRsvp(
    @Param('id') eventId: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<void> {
    await this.eventsService.cancelRsvp(eventId, userId);
  }

  @Get(':id/rsvps')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRsvps(@Param('id') eventId: string): Promise<RsvpResponseDto[]> {
    return this.eventsService.getRsvps(eventId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() updateEventDto: CreateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, userId, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('admin')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<void> {
    await this.eventsService.delete(id, userId);
  }
}
