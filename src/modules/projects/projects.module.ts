import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { ProjectsController } from './projects.controller';
import { ProjectSubmissionsController } from './project-submissions.controller';
import { ProjectsService } from './projects.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [DatabaseModule, UploadsModule],
  controllers: [ProjectsController, ProjectSubmissionsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}