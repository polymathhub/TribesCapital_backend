import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { MessagingService } from './messaging.service';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      client.data ??= {};
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.toString()?.replace('Bearer ', '');
      if (!token) {
        const environment = this.configService.get<string>('app.environment') ?? process.env.NODE_ENV ?? 'development';
        if (environment !== 'production') {
          client.data.userId = 'demo-user';
          client.join('user:demo-user');
          const presence = await this.messagingService.trackUserOnline('demo-user', client.id);
          if (presence.firstSession) this.server.emit('user:online', { userId: 'demo-user' });
          return;
        }
        client.disconnect?.();
        return;
      }
      const payload = await this.jwtService.verifyAsync(token, { secret: this.configService.get('jwt.secret') ?? this.configService.get('JWT_SECRET') });
      if (!payload?.sub && !payload?.id) {
        client.disconnect?.();
        return;
      }
      const userId = payload.sub ?? payload.id;
      client.data.userId = userId;
      client.join(`user:${userId}`);
      const presence = await this.messagingService.trackUserOnline(userId, client.id);
      if (presence.firstSession) this.server.emit('user:online', { userId });
    } catch {
      client.disconnect?.();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;
    const presence = await this.messagingService.trackUserOffline(userId, client.id);
    if (presence.lastSession) this.server.emit('user:offline', { userId });
  }

  @SubscribeMessage('presence:heartbeat')
  async presenceHeartbeat(@ConnectedSocket() client: Socket) {
    if (!client.data.userId) return { ok: false };
    const presence = await this.messagingService.trackUserHeartbeat(client.data.userId, client.id);
    if (presence.firstSession) this.server.emit('user:online', { userId: client.data.userId });
    return { ok: true };
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: string }) {
    const userId = client.data.userId;
    if (!userId || !payload?.conversationId) return { ok: false, message: 'Unauthorized' };
    await this.messagingService.ensureUserAccess(userId, payload.conversationId);
    client.join(`conversation:${payload.conversationId}`);
    return { ok: true, conversationId: payload.conversationId };
  }

  @SubscribeMessage('conversation:leave')
  async leaveConversation(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: string }) {
    if (!payload?.conversationId) return { ok: false, message: 'Conversation is required' };
    client.leave(`conversation:${payload.conversationId}`);
    return { ok: true, conversationId: payload.conversationId };
  }

  @SubscribeMessage('message:send')
  async sendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: Record<string, any>) {
    try {
      const userId = client.data.userId;
      if (!userId || !payload?.conversationId) return { ok: false, message: 'Unauthorized' };
      const conversationId = payload.conversationId;
      const content = typeof payload.content === 'string' ? payload.content.trim() : '';
      const replyToId = typeof payload.replyToId === 'string' ? payload.replyToId : payload.replyToId?.id;
      if (!content && !payload.attachments?.length) return { ok: false, message: 'Message content is required' };
      await this.messagingService.ensureUserAccess(userId, conversationId);
      const message = await this.messagingService.createMessage({ userId, conversationId, content, type: payload.type, replyToId, mentions: Array.isArray(payload.mentions) ? payload.mentions : undefined, attachmentData: Array.isArray(payload.attachments) ? payload.attachments : undefined });
      const realtimeMessage = payload.clientMessageId ? { ...message, clientMessageId: payload.clientMessageId } : message;
      this.server.to(`conversation:${conversationId}`).emit('message:new', realtimeMessage);
      if (this.prisma?.conversationMember?.findMany) {
        const recipients = await this.prisma.conversationMember.findMany({ where: { conversationId, userId: { not: userId } }, select: { userId: true } });
        for (const recipient of recipients) {
          this.server.to(`user:${recipient.userId}`).emit('notification:new', {
            type: 'new-message',
            title: `New message from ${[message.sender?.firstName, message.sender?.lastName].filter(Boolean).join(' ') || 'Someone'}`,
            message: content || 'Sent an attachment',
            data: { conversationId, messageId: message.id },
          });
        }
      }
      return { ok: true, message: realtimeMessage };
    } catch (error: any) {
      const message = error?.response?.message ?? error?.message ?? 'Unable to send message';
      return { ok: false, message: Array.isArray(message) ? message.join(', ') : String(message) };
    }
  }

  @SubscribeMessage('typing:start')
  async typingStart(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: string }) {
    const userId = client.data.userId;
    if (!userId || !payload?.conversationId) return;
    await this.messagingService.ensureUserAccess(userId, payload.conversationId);
    client.to(`conversation:${payload.conversationId}`).emit('user:typing', { userId, conversationId: payload.conversationId });
  }

  @SubscribeMessage('typing:stop')
  async typingStop(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: string }) {
    const userId = client.data.userId;
    if (!userId || !payload?.conversationId) return;
    await this.messagingService.ensureUserAccess(userId, payload.conversationId);
    client.to(`conversation:${payload.conversationId}`).emit('user:typing:stop', { userId, conversationId: payload.conversationId });
  }

  @SubscribeMessage('message:edit')
  async editMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageId: string; content: string }) {
    const message = await this.messagingService.updateMessage(client.data.userId, payload.messageId, payload.content);
    this.server.to(`conversation:${message.conversationId}`).emit('message:updated', message);
    return { ok: true, message };
  }

  @SubscribeMessage('message:delete')
  async deleteMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageId: string }) {
    const message = await this.prisma.message.findUnique({ where: { id: payload.messageId }, select: { conversationId: true } });
    const result = await this.messagingService.deleteMessage(client.data.userId, payload.messageId);
    if (message) this.server.to(`conversation:${message.conversationId}`).emit('message:deleted', { id: result.id });
    return { ok: true, ...result };
  }

  @SubscribeMessage('message:react')
  async reactToMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageId: string; reaction: string }) {
    const result = await this.messagingService.toggleReaction(client.data.userId, payload.messageId, payload.reaction);
    const message = await this.prisma.message.findUnique({ where: { id: payload.messageId }, select: { conversationId: true } });
    if (message) this.server.to(`conversation:${message.conversationId}`).emit('message:reaction', result);
    return { ok: true, ...result };
  }

  @SubscribeMessage('message:read')
  async readMessages(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageIds: string[] }) {
    const messageIds = Array.from(new Set(payload?.messageIds ?? []));
    const result = await this.messagingService.markMessagesRead(client.data.userId, messageIds);
    if (messageIds.length) {
      const messages = await this.prisma.message.findMany({ where: { id: { in: messageIds } }, select: { id: true, conversationId: true } });
      const messagesByConversation = new Map<string, string[]>();
      for (const message of messages) {
        const ids = messagesByConversation.get(message.conversationId) ?? [];
        ids.push(message.id);
        messagesByConversation.set(message.conversationId, ids);
      }
      for (const [conversationId, ids] of messagesByConversation) this.server.to(`conversation:${conversationId}`).emit('message:read', { userId: client.data.userId, messageIds: ids });
    }
    return { ok: true, ...result };
  }
}
