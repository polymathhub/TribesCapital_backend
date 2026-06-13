import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { VideoService } from './video.service';
import { PrismaService } from '@database/prisma.service';

@Module({
  controllers: [LessonsController],
  providers: [LessonsService, VideoService, PrismaService],
  exports: [LessonsService, VideoService],
})
export class LessonsModule {}
