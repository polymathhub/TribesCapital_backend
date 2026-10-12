import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  AdminListQueryDto,
  AdminUpdateUserDto,
  AssignReviewerDto,
  CreateDiligenceFromProjectDto,
  CreateInvestmentApprovalDto,
  InvestmentDecisionDto,
  ProjectScreeningDecisionDto,
} from './dto/admin-operations.dto';
import { AdminOperationsService } from './admin-operations.service';

@Controller('admin/operations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super-admin')
@ApiTags('Admin operations')
@ApiBearerAuth()
export class AdminOperationsController {
  constructor(private readonly adminOperationsService: AdminOperationsService) {}

  @Get('overview')
  getOverview() {
    return this.adminOperationsService.getOverview();
  }

  @Get('projects')
  listProjects(@Query() query: AdminListQueryDto) {
    return this.adminOperationsService.listProjects(query);
  }

  @Get('projects/:projectId')
  getProject(@Param('projectId') projectId: string) {
    return this.adminOperationsService.getProject(projectId);
  }

  @Patch('projects/:projectId/reviewer')
  assignProjectReviewer(
    @Param('projectId') projectId: string,
    @GetCurrentUser('sub') actorId: string,
    @Body() dto: AssignReviewerDto,
  ) {
    return this.adminOperationsService.assignProjectReviewer(projectId, actorId, dto);
  }

  @Patch('projects/:projectId/screening-decision')
  @Roles('project-reviewer', 'admin', 'super-admin')
  decideProject(
    @Param('projectId') projectId: string,
    @GetCurrentUser('sub') actorId: string,
    @Body() dto: ProjectScreeningDecisionDto,
  ) {
    return this.adminOperationsService.decideProject(projectId, actorId, dto);
  }

  @Post('projects/:projectId/due-diligence')
  createDiligenceForProject(
    @Param('projectId') projectId: string,
    @GetCurrentUser('sub') actorId: string,
    @Body() dto: CreateDiligenceFromProjectDto,
  ) {
    return this.adminOperationsService.createDiligenceForProject(projectId, actorId, dto);
  }

  @Get('due-diligence')
  listDiligence(@Query() query: AdminListQueryDto) {
    return this.adminOperationsService.listDiligence(query);
  }

  @Patch('due-diligence/:diligenceId/reviewer')
  assignDiligenceReviewer(
    @Param('diligenceId') diligenceId: string,
    @GetCurrentUser('sub') actorId: string,
    @Body() dto: AssignReviewerDto,
  ) {
    return this.adminOperationsService.assignDiligenceReviewer(diligenceId, actorId, dto);
  }

  @Post('due-diligence/:diligenceId/approvals')
  createInvestmentApproval(
    @Param('diligenceId') diligenceId: string,
    @GetCurrentUser('sub') actorId: string,
    @Body() dto: CreateInvestmentApprovalDto,
  ) {
    return this.adminOperationsService.createInvestmentApproval(diligenceId, actorId, dto);
  }

  @Patch('due-diligence/:diligenceId/approvals/:approvalId')
  @Roles('investment-approver')
  decideInvestmentApproval(
    @Param('diligenceId') diligenceId: string,
    @Param('approvalId') approvalId: string,
    @GetCurrentUser('sub') actorId: string,
    @Body() dto: InvestmentDecisionDto,
  ) {
    return this.adminOperationsService.decideInvestmentApproval(diligenceId, approvalId, actorId, dto);
  }

  @Get('users')
  listUsers(@Query() query: AdminListQueryDto) {
    return this.adminOperationsService.listUsers(query);
  }

  @Get('roles')
  listRoles() {
    return this.adminOperationsService.listRoles();
  }

  @Patch('users/:userId/access')
  updateUserAccess(
    @Param('userId') userId: string,
    @GetCurrentUser('sub') actorId: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminOperationsService.updateUser(userId, actorId, dto);
  }

  @Get('audit-history')
  listAuditHistory(@Query() query: AdminListQueryDto) {
    return this.adminOperationsService.listAuditHistory(query);
  }
}
