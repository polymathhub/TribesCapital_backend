import { Body, Controller, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }) {
    return this.notificationsService.listForUser(user.id);
  }

  @Post()
  async create(@CurrentUser() user: { id: string }, @Body() body: { type: string; title: string; message: string; data?: Record<string, unknown> }) {
    return this.notificationsService.createForUser(user.id, {
      type: body.type || 'event-notification',
      title: body.title || 'Event notification',
      message: body.message || 'You will be notified about event updates.',
      data: body.data || {},
    });
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async broadcast(
    @CurrentUser() user: { id: string },
    @Body() body: { type?: string; title: string; message: string; data?: Record<string, unknown> },
  ) {
    return this.notificationsService.createForAllUsers({
      type: body.type || 'announcement',
      title: body.title,
      message: body.message,
      actorId: user.id,
      data: body.data || {},
    });
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
