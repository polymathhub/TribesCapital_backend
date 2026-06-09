import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { VideoService } from './video.service';

@Module({
  controllers: [LessonsController],
  providers: [LessonsService, VideoService],
  exports: [LessonsService, VideoService],
})
export class LessonsModule {}
