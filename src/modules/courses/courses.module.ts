import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { RolesModule } from '@modules/roles/roles.module';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';

@Module({
  imports: [DatabaseModule, RolesModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
