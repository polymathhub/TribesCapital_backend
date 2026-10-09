import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { InvestorOnly, InvestorReadOnly } from '@common/decorators/account-type-access.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateProjectDto, UpdateProjectDto, UpdateProjectStatusDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@InvestorReadOnly()
@ApiTags('Projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(
    @GetCurrentUser('sub') userId: string,
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 50,
    @Query('status') status?: string,
  ) {
    return this.projectsService.list(userId, skip, take, status);
  }

  @Post()
  @InvestorOnly()
  create(@GetCurrentUser('sub') userId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(userId, dto);
  }

  @Get(':id')
  getById(@Param('id') id: string, @GetCurrentUser('sub') userId: string) {
    return this.projectsService.getById(id, userId);
  }

  @Get(':id/attachments/:index/download')
  async downloadAttachment(
    @Param('id') id: string,
    @Param('index', new ParseIntPipe()) index: number,
    @GetCurrentUser('sub') userId: string,
  ) {
    const url = await this.projectsService.getAttachmentDownloadUrl(id, userId, index);
    return { url };
  }

  @Patch(':id/status')
  @InvestorOnly()
  updateStatus(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.projectsService.updateStatus(id, userId, dto.status);
  }

  @Patch(':id')
  @InvestorOnly()
  update(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, userId, dto);
  }

  @Delete(':id')
  @InvestorOnly()
  remove(@Param('id') id: string, @GetCurrentUser('sub') userId: string) {
    return this.projectsService.remove(id, userId);
  }
}