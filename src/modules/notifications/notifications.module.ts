import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { RolesModule } from '@modules/roles/roles.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService, DatabaseModule],
})
export class NotificationsModule {}
