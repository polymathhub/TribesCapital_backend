import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ProjectSubmissionDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';

@Controller('project-submissions')
@UseGuards(JwtAuthGuard)
@ApiTags('Project submissions')
@ApiBearerAuth()
export class ProjectSubmissionsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  submit(@GetCurrentUser('sub') userId: string, @Body() dto: ProjectSubmissionDto) {
    return this.projectsService.submit(userId, dto);
  }
}
