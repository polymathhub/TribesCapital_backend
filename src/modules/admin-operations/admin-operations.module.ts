import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { RolesModule } from '@modules/roles/roles.module';
import { AdminOperationsController } from './admin-operations.controller';
import { AdminOperationsService } from './admin-operations.service';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [AdminOperationsController],
  providers: [AdminOperationsService],
  exports: [AdminOperationsService],
})
export class AdminOperationsModule {}
