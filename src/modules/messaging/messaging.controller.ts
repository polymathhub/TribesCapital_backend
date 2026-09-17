import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import {
  CreateConversationDto,
  CreateMessageDto,
  MessageSearchDto,
  ReactionDto,
  ReadMessagesDto,
  ReportMessageDto,
  UpdateMessageDto,
} from './messaging.dto';

const messagingUploadDirectory = join(process.cwd(), 'uploads', 'messaging');
mkdirSync(messagingUploadDirectory, { recursive: true });

const allowedAttachmentMimeTypes = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/csv', 'application/zip',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const mimeExtensions: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'application/pdf': '.pdf', 'text/plain': '.txt', 'text/csv': '.csv', 'application/zip': '.zip',
  'application/msword': '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx', 'application/vnd.ms-excel': '.xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
};

const normalizeLimit = (value: string | undefined, fallback = 25, max = 100) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), max);
};

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  async createConversation(@CurrentUser() user: any, @Body() body: CreateConversationDto) {
    return this.messagingService.createConversation({
      type: body.type, userId: user.id, participantIds: body.participantIds ?? [], title: body.title, description: body.description,
      avatar: body.avatar, projectId: body.projectId, dueDiligenceId: body.dueDiligenceId, channelName: body.channelName, isPrivateChannel: body.isPrivateChannel,
    });
  }

  @Get('conversations')
  async listConversations(@CurrentUser() user: any) { return this.messagingService.listConversations(user.id); }

  @Get('active-users')
  async listActiveUsers() { return this.messagingService.listActiveUsers(); }

  @Get('conversations/:id')
  async getConversation(@CurrentUser() user: any, @Param('id') id: string) { return this.messagingService.getConversation(user.id, id); }

  @Get('conversations/:id/messages')
  async getMessages(@CurrentUser() user: any, @Param('id') id: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.messagingService.getMessages(user.id, id, cursor, normalizeLimit(limit));
  }

  @Post('conversations/:id/messages')
  async createMessage(@CurrentUser() user: any, @Param('id') id: string, @Body() body: CreateMessageDto) {
    return this.messagingService.createMessage({ userId: user.id, conversationId: id, content: body.content, type: body.type, replyToId: body.replyToId, mentions: body.mentions, attachmentData: body.attachments });
  }

  @Get('search')
  async searchMessages(@CurrentUser() user: any, @Query() query: MessageSearchDto) { return this.messagingService.searchMessages(user.id, query.query, normalizeLimit(String(query.limit ?? 25))); }

  @Get('unread')
  async getUnreadCounts(@CurrentUser() user: any) { return this.messagingService.getUnreadCounts(user.id); }

  @Patch('messages/:id')
  async updateMessage(@CurrentUser() user: any, @Param('id') id: string, @Body() body: UpdateMessageDto) {
    if (!body.content?.trim()) throw new BadRequestException('Message content cannot be empty');
    return this.messagingService.updateMessage(user.id, id, body.content.trim());
  }

  @Post('conversations/:id/attachments')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: messagingUploadDirectory,
      filename: (_request: Express.Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
        const extension = mimeExtensions[file.mimetype] ?? extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
        callback(null, `${randomUUID()}${extension}`);
      },
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      if (!allowedAttachmentMimeTypes.has(file.mimetype)) return callback(new BadRequestException('Unsupported attachment type'), false);
      callback(null, true);
    },
  }))
  async uploadAttachment(@CurrentUser() user: any, @Param('id') conversationId: string, @UploadedFile() file?: Express.Multer.File) {
    return this.messagingService.uploadAttachment(user.id, conversationId, file);
  }

  @Delete('messages/:id')
  async deleteMessage(@CurrentUser() user: any, @Param('id') id: string) { return this.messagingService.deleteMessage(user.id, id); }

  @Post('messages/:id/reactions')
  async addReaction(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ReactionDto) { return this.messagingService.addReaction(user.id, id, body.reaction); }

  @Post('messages/:id/reactions/toggle')
  async toggleReaction(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ReactionDto) { return this.messagingService.toggleReaction(user.id, id, body.reaction); }

  @Delete('messages/:id/reactions/:reaction')
  async removeReaction(@CurrentUser() user: any, @Param('id') id: string, @Param('reaction') reaction: string) { return this.messagingService.removeReaction(user.id, id, reaction); }

  @Post('messages/:id/read')
  async markRead(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ReadMessagesDto) { return this.messagingService.markMessagesRead(user.id, body?.messageIds?.length ? body.messageIds : [id]); }

  @Post('messages/:id/report')
  async reportMessage(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ReportMessageDto) { return this.messagingService.reportMessage(user.id, id, body.reason, body.details); }
}
