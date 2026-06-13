import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { DatabaseModule } from '@database/database.module';
import { RolesModule } from '@modules/roles/roles.module';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
