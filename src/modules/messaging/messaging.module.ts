import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MemberDirectoryController } from './member-directory.controller';
import { MessagingGateway } from './messaging.gateway';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule, AuthModule, NotificationsModule],
  controllers: [MessagingController, MemberDirectoryController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
