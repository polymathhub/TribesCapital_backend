import {
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
import { join } from 'path';
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

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  async createConversation(
    @CurrentUser() user: any,
    @Body() body: CreateConversationDto,
  ) {
    return this.messagingService.createConversation({
      type: body.type,
      userId: user.id,
      participantIds: body.participantIds ?? [],
      title: body.title,
      description: body.description,
      avatar: body.avatar,
      projectId: body.projectId,
      dueDiligenceId: body.dueDiligenceId,
      channelName: body.channelName,
      isPrivateChannel: body.isPrivateChannel,
    });
  }

  @Get('conversations')
  async listConversations(@CurrentUser() user: any) {
    return this.messagingService.listConversations(user.id);
  }

  @Get('conversations/:id')
  async getConversation(@CurrentUser() user: any, @Param('id') id: string) {
    return this.messagingService.getConversation(user.id, id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagingService.getMessages(user.id, id, cursor, Number(limit ?? 25));
  }

  @Post('conversations/:id/messages')
  async createMessage(@CurrentUser() user: any, @Param('id') id: string, @Body() body: CreateMessageDto) {
    return this.messagingService.createMessage({
      userId: user.id,
      conversationId: id,
      content: body.content,
      type: body.type,
      replyToId: body.replyToId,
      mentions: body.mentions,
      attachmentData: body.attachments,
    });
  }

  @Get('search')
  async searchMessages(@CurrentUser() user: any, @Query() query: MessageSearchDto) {
    return this.messagingService.searchMessages(user.id, query.query, query.limit);
  }

  @Get('unread')
  async getUnreadCounts(@CurrentUser() user: any) {
    return this.messagingService.getUnreadCounts(user.id);
  }

  @Patch('messages/:id')
  async updateMessage(@CurrentUser() user: any, @Param('id') id: string, @Body() body: UpdateMessageDto) {
    return this.messagingService.updateMessage(user.id, id, body.content);
  }

  @Post('conversations/:id/attachments')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: messagingUploadDirectory,
      filename: (_request: Express.Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
        callback(null, `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
      },
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
  }))
  async uploadAttachment(
    @CurrentUser() user: any,
    @Param('id') conversationId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.messagingService.uploadAttachment(user.id, conversationId, file);
  }

  @Delete('messages/:id')
  async deleteMessage(@CurrentUser() user: any, @Param('id') id: string) {
    return this.messagingService.deleteMessage(user.id, id);
  }

  @Post('messages/:id/reactions')
  async addReaction(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ReactionDto) {
    return this.messagingService.addReaction(user.id, id, body.reaction);
  }

  @Delete('messages/:id/reactions/:reaction')
  async removeReaction(@CurrentUser() user: any, @Param('id') id: string, @Param('reaction') reaction: string) {
    return this.messagingService.removeReaction(user.id, id, reaction);
  }

  @Post('messages/:id/read')
  async markRead(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ReadMessagesDto) {
    return this.messagingService.markMessagesRead(user.id, body?.messageIds?.length ? body.messageIds : [id]);
  }

  @Post('messages/:id/report')
  async reportMessage(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ReportMessageDto) {
    return this.messagingService.reportMessage(user.id, id, body.reason, body.details);
  }
}
