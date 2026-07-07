import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
} from '@nestjs/common';
import { DueDiligenceService } from './due-diligence.service';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import {
  CreateDueDiligenceDto,
  UpdateDueDiligenceDto,
  CreateDDItemDto,
  UpdateDDItemDto,
  CreateDDDocumentDto,
  ReviewDDDocumentDto,
  CreateDDCommentDto,
  CreateDDApprovalDto,
  ApproveDDDto,
  QueryDDDto,
} from './dto/due-diligence.dto';

@Controller('due-diligence')
export class DueDiligenceController {
  constructor(private service: DueDiligenceService) {}

  /* ═══════════════════════════════════════════════════════════ */
  /*               DUE DILIGENCE ENDPOINTS                       */
  /* ═══════════════════════════════════════════════════════════ */

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateDueDiligenceDto, @GetCurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Get()
  async findAll(@Query() query: QueryDDDto, @GetCurrentUser('id') userId: string) {
    return this.service.findAll(query, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @GetCurrentUser('id') userId: string) {
    return this.service.findOne(id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDueDiligenceDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string, @GetCurrentUser('id') userId: string) {
    return this.service.delete(id, userId);
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               ITEMS MANAGEMENT                              */
  /* ═══════════════════════════════════════════════════════════ */

  @Post(':id/items')
  @HttpCode(201)
  async createItem(
    @Param('id') dueDiligenceId: string,
    @Body() dto: CreateDDItemDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.createItem(dueDiligenceId, dto, userId);
  }

  @Put(':id/items/:itemId')
  async updateItem(
    @Param('id') dueDiligenceId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateDDItemDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.updateItem(dueDiligenceId, itemId, dto, userId);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(204)
  async deleteItem(
    @Param('id') dueDiligenceId: string,
    @Param('itemId') itemId: string,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.deleteItem(dueDiligenceId, itemId, userId);
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               DOCUMENTS                                      */
  /* ═══════════════════════════════════════════════════════════ */

  @Post(':id/documents')
  @HttpCode(201)
  async uploadDocument(
    @Param('id') dueDiligenceId: string,
    @Body() dto: CreateDDDocumentDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.uploadDocument(dueDiligenceId, dto, userId);
  }

  @Put(':id/documents/:docId/review')
  async reviewDocument(
    @Param('id') dueDiligenceId: string,
    @Param('docId') docId: string,
    @Body() dto: ReviewDDDocumentDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.reviewDocument(dueDiligenceId, docId, dto, userId);
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               COMMENTS                                       */
  /* ═══════════════════════════════════════════════════════════ */

  @Post(':id/comments')
  @HttpCode(201)
  async addComment(
    @Param('id') dueDiligenceId: string,
    @Body() dto: CreateDDCommentDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.addComment(dueDiligenceId, dto, userId);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(204)
  async deleteComment(
    @Param('id') dueDiligenceId: string,
    @Param('commentId') commentId: string,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.deleteComment(dueDiligenceId, commentId, userId);
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               APPROVALS                                      */
  /* ═══════════════════════════════════════════════════════════ */

  @Post(':id/approvals')
  @HttpCode(201)
  async createApproval(
    @Param('id') dueDiligenceId: string,
    @Body() dto: CreateDDApprovalDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.createApproval(dueDiligenceId, dto, userId);
  }

  @Put(':id/approvals/:approvalId')
  async approveOrReject(
    @Param('id') dueDiligenceId: string,
    @Param('approvalId') approvalId: string,
    @Body() dto: ApproveDDDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.approveOrReject(dueDiligenceId, approvalId, dto, userId);
  }
}
