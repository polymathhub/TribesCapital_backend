import { Module } from '@nestjs/common';
import { DueDiligenceService } from './due-diligence.service';
import { DueDiligenceController } from './due-diligence.controller';
import { PrismaService } from '@database/prisma.service';

@Module({
  controllers: [DueDiligenceController],
  providers: [DueDiligenceService, PrismaService],
  exports: [DueDiligenceService],
})
export class DueDiligenceModule {}
