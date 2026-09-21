import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { RolesModule } from '@modules/roles/roles.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [DatabaseModule, AnalyticsService],
})
export class AnalyticsModule {}
