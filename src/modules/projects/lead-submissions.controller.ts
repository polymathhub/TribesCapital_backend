import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { InvestorOnly, InvestorReadOnly } from '@common/decorators/account-type-access.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import {
  AdminLeadListQueryDto,
  AssignLeadReviewerDto,
  CreateLeadDraftDto,
  SubmitLeadDto,
  TransitionLeadDto,
  UpdateLeadDraftDto,
} from './lead-submissions.dto';
import { LeadSubmissionsService } from './lead-submissions.service';

@Controller('lead-submissions')
@UseGuards(JwtAuthGuard)
@InvestorReadOnly()
@ApiTags('Lead submissions')
@ApiBearerAuth()
export class LeadSubmissionsController {
  constructor(private readonly leadSubmissionsService: LeadSubmissionsService) {}

  @Get()
  list(
    @GetCurrentUser('sub') userId: string,
    @Query() query: AdminLeadListQueryDto,
  ) {
    return this.leadSubmissionsService.list(userId, query);
  }

  @Get(':id')
  getById(@Param('id') id: string, @GetCurrentUser('sub') userId: string) {
    return this.leadSubmissionsService.getById(id, userId);
  }

  @Post('drafts')
  @InvestorOnly()
  createDraft(@GetCurrentUser('sub') userId: string, @Body() dto: CreateLeadDraftDto) {
    return this.leadSubmissionsService.createDraft(userId, dto);
  }

  @Patch('drafts/:id')
  @InvestorOnly()
  updateDraft(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: UpdateLeadDraftDto,
  ) {
    return this.leadSubmissionsService.updateDraft(userId, id, dto.payload ?? {});
  }

  @Post('submit')
  @InvestorOnly()
  submit(@GetCurrentUser('sub') userId: string, @Body() dto: SubmitLeadDto) {
    return this.leadSubmissionsService.submitLead(userId, dto);
  }

  @Patch(':id/reviewer')
  @InvestorOnly()
  assignReviewer(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: AssignLeadReviewerDto,
  ) {
    return this.leadSubmissionsService.assignReviewer(userId, id, dto);
  }

  @Patch(':id/status')
  @InvestorOnly()
  transitionStatus(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: TransitionLeadDto,
  ) {
    return this.leadSubmissionsService.transitionStatus(userId, id, dto);
  }
}
