import { Module } from '@nestjs/common';
import { DueDiligenceService } from './due-diligence.service';
import { DueDiligenceController } from './due-diligence.controller';

@Module({
  controllers: [DueDiligenceController],
  providers: [DueDiligenceService],
  exports: [DueDiligenceService],
})
export class DueDiligenceModule {}
