import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { VideoService } from './video.service';
import { VideoTrackingService } from './video-tracking.service';
import { PrismaService } from '@database/prisma.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LessonsController],
  providers: [LessonsService, VideoService, VideoTrackingService, PrismaService],
  exports: [LessonsService, VideoService, VideoTrackingService],
})
export class LessonsModule {}
