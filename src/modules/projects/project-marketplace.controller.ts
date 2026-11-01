import { Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { GuestReadable } from '@common/decorators/account-type-access.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ProjectMarketplaceService } from './project-marketplace.service';

@Controller('project-marketplace')
@UseGuards(JwtAuthGuard)
@ApiTags('Project marketplace')
@ApiBearerAuth()
export class ProjectMarketplaceController {
  constructor(private readonly projectMarketplaceService: ProjectMarketplaceService) {}

  @Get()
  @GuestReadable()
  list(
    @GetCurrentUser('sub') userId: string,
    @Query('skip', new ParseIntPipe({ optional: true })) skip = 0,
    @Query('take', new ParseIntPipe({ optional: true })) take = 50,
  ) {
    return this.projectMarketplaceService.list(userId, skip, take);
  }

  @Post(':projectId/waitlist')
  joinWaitlist(
    @GetCurrentUser('sub') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectMarketplaceService.joinWaitlist(userId, projectId);
  }

  @Delete(':projectId/waitlist')
  leaveWaitlist(
    @GetCurrentUser('sub') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectMarketplaceService.leaveWaitlist(userId, projectId);
  }
}
