import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { DueDiligenceService } from './due-diligence.service';
import { DueDiligenceController } from './due-diligence.controller';
import { PrismaService } from '@database/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [DueDiligenceController],
  providers: [DueDiligenceService, PrismaService],
  exports: [DueDiligenceService],
})
export class DueDiligenceModule {}