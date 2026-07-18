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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
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

const UPLOADS_BASE_URL = '/uploads';

function getDueDiligenceUploadsDir() {
  const uploadsDir = join(process.cwd(), 'uploads', 'due-diligence');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

function inferDocumentType(originalname: string, mimetype: string) {
  const ext = originalname.split('.').pop()?.toLowerCase();
  if (ext) {
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'zip', 'rar'].includes(ext)) {
      return ext;
    }
  }
  if (mimetype.includes('pdf')) return 'pdf';
  if (mimetype.includes('word')) return 'word';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'excel';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'other';
}

@Controller('due-diligence')
export class DueDiligenceController {
  constructor(private service: DueDiligenceService) {}

  /* ═══════════════════════════════════════════════════════════ */
  /*               DUE DILIGENCE ENDPOINTS                       */
  /* ═══════════════════════════════════════════════════════════ */

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateDueDiligenceDto, @GetCurrentUser('sub') userId: string) {
    if (!userId) {
      throw new BadRequestException('Authenticated user is required to create a due diligence case.');
    }
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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: () => getDueDiligenceUploadsDir(),
        filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const timestamp = Date.now();
          const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-');
          cb(null, `${timestamp}-${sanitized}`);
        },
      }),
    }),
  )
  async uploadDocument(
    @Param('id') dueDiligenceId: string,
    @Body() dto: CreateDDDocumentDto,
    @GetCurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file && !dto.fileUrl) {
      throw new BadRequestException('Either a file upload or a file URL is required.');
    }

    if (file) {
      dto.fileUrl = `${UPLOADS_BASE_URL}/due-diligence/${file.filename}`;
      dto.fileName = dto.fileName || file.originalname;
      dto.fileType = dto.fileType || inferDocumentType(file.originalname, file.mimetype);
      dto.fileSize = file.size;
    }

    if (typeof dto.tags === 'string') {
      dto.tags = dto.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    }

    return this.service.uploadDocument(dueDiligenceId, dto, userId);
  }

  @Delete(':id/documents/:docId')
  @HttpCode(204)
  async deleteDocument(
    @Param('id') dueDiligenceId: string,
    @Param('docId') docId: string,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.service.deleteDocument(dueDiligenceId, docId, userId);
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
  @UseInterceptors(
    FilesInterceptor('attachments', 5, {
      storage: diskStorage({
        destination: () => getDueDiligenceUploadsDir(),
        filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const timestamp = Date.now();
          const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-_]/g, '-');
          cb(null, `${timestamp}-${sanitized}`);
        },
      }),
    }),
  )
  async addComment(
    @Param('id') dueDiligenceId: string,
    @Body() dto: CreateDDCommentDto,
    @GetCurrentUser('id') userId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const attachments = Array.isArray(dto.attachments) ? [...dto.attachments] : [];
    if (files && files.length > 0) {
      files.forEach((file) => {
        attachments.push(`${UPLOADS_BASE_URL}/due-diligence/${file.filename}`);
      });
      dto.attachments = attachments;
    }
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
