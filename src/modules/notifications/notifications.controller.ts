import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
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

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
