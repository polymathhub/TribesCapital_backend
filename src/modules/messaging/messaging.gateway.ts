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
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { MessagingService } from './messaging.service';
import { JwtTokenService } from '../auth/jwt-token.service';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.toString()?.replace(/^Bearer\s+/i, '');
      if (!token) {
        const environment = this.configService.get<string>('app.environment') ?? process.env.NODE_ENV ?? 'development';
        if (environment !== 'production') {
          client.data.userId = 'demo-user';
          client.join('user:demo-user');
          const presence = await this.messagingService.trackUserOnline('demo-user', client.id);
          if (presence.firstSession) this.server.emit('user:online', { userId: 'demo-user' });
          this.server.to(client.id).emit('presence:snapshot', await this.messagingService.listActiveUsers());
          return;
        }
        client.disconnect(true);
        return;
      }

      // Use the same JWT configuration as HTTP authentication. The previous
      // gateway verified tokens directly with jwt.secret, which could diverge
      // from the access-token signing/verification key (especially RS256).
      const payload = await this.jwtTokenService.verifyAccessToken(token) as { sub?: string; id?: string };
      const userId = payload?.sub ?? payload?.id;
      if (!userId) {
        client.disconnect(true);
        return;
      }

      client.data.userId = userId;
      client.join(`user:${userId}`);
      const presence = await this.messagingService.trackUserOnline(userId, client.id);
      if (presence.firstSession) this.server.emit('user:online', { userId });
      this.server.to(client.id).emit('presence:snapshot', await this.messagingService.listActiveUsers());
    } catch {
      client.disconnect(true);
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
    if (!client.data.userId) return { ok: false, message: 'Unauthorized' };
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
      const attachments = Array.isArray(payload.attachments) ? payload.attachments : undefined;
      if (!content && !attachments?.length) return { ok: false, message: 'Message content is required' };

      await this.messagingService.ensureUserAccess(userId, conversationId);
      const message = await this.messagingService.createMessage({
        userId,
        conversationId,
        content,
        type: payload.type,
        replyToId,
        mentions: Array.isArray(payload.mentions) ? payload.mentions : undefined,
        attachmentData: attachments,
      });
      const realtimeMessage = payload.clientMessageId ? { ...message, clientMessageId: payload.clientMessageId } : message;

      // Deliver to the conversation room for users who have it open and also
      // to every member's personal room so a recipient can receive a DM while
      // browsing another conversation, just like a modern chat app.
      this.server.to(`conversation:${conversationId}`).emit('message:new', realtimeMessage);
      const members = await this.prisma.conversationMember.findMany({
        where: { conversationId, userId: { not: userId } },
        select: { userId: true },
      });
      for (const member of members) {
        this.server.to(`user:${member.userId}`).emit('message:new', realtimeMessage);
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
