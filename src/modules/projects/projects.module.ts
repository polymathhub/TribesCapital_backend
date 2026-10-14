import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { ProjectsController } from './projects.controller';
import { ProjectSubmissionsController } from './project-submissions.controller';
import { LeadSubmissionsController } from './lead-submissions.controller';
import { ProjectsService } from './projects.service';
import { LeadSubmissionsService } from './lead-submissions.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [DatabaseModule, UploadsModule],
  controllers: [ProjectsController, ProjectSubmissionsController, LeadSubmissionsController],
  providers: [ProjectsService, LeadSubmissionsService],
  exports: [ProjectsService, LeadSubmissionsService],
})
export class ProjectsModule {}