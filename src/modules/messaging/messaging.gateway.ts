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
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.toString()?.replace('Bearer ', '');
      if (!token) {
        const environment = this.configService.get<string>('app.environment') ?? process.env.NODE_ENV ?? 'development';
        if (environment !== 'production') {
          client.data.userId = 'demo-user';
          client.join('user:demo-user');
          this.server.emit('user:online', { userId: 'demo-user' });
          return;
        }
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret') ?? this.configService.get('JWT_SECRET'),
      });
      if (!payload?.sub && !payload?.id) {
        client.disconnect();
        return;
      }

      const userId = payload.sub ?? payload.id;
      client.data.userId = userId;
      this.messagingService.trackUserOnline(userId);
      client.join(`user:${userId}`);
      this.server.emit('user:online', { userId });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.messagingService.trackUserOffline(userId);
      this.server.emit('user:offline', { userId });
    }
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: string }) {
    const userId = client.data.userId;
    if (!userId || !payload?.conversationId) {
      return { ok: false, message: 'Unauthorized' };
    }

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
    const userId = client.data.userId;
    if (!userId || !payload?.conversationId) {
      return { ok: false, message: 'Unauthorized' };
    }

    const conversationId = payload.conversationId;
    await this.messagingService.ensureUserAccess(userId, conversationId);
    const message = await this.messagingService.createMessage({
      userId,
      conversationId,
      content: payload.content,
      type: payload.type,
      replyToId: payload.replyToId,
      mentions: payload.mentions,
      attachmentData: payload.attachments,
    });

    // Conversation rooms are the source of truth for realtime message delivery.
    // Avoid emitting the same message to every member's user room as well; that
    // caused duplicate events and unnecessary fan-out for larger channels.
    this.server.to(`conversation:${conversationId}`).emit('message:new', message);
    return { ok: true, message };
  }

  @SubscribeMessage('typing:start')
  async typingStart(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: string }) {
    const userId = client.data.userId;
    if (!userId || !payload?.conversationId) return;
    await this.messagingService.ensureUserAccess(userId, payload.conversationId);
    client.to(`conversation:${payload.conversationId}`).emit('user:typing', {
      userId,
      conversationId: payload.conversationId,
    });
  }

  @SubscribeMessage('typing:stop')
  async typingStop(@ConnectedSocket() client: Socket, @MessageBody() payload: { conversationId: string }) {
    const userId = client.data.userId;
    if (!userId || !payload?.conversationId) return;
    await this.messagingService.ensureUserAccess(userId, payload.conversationId);
    client.to(`conversation:${payload.conversationId}`).emit('user:typing:stop', {
      userId,
      conversationId: payload.conversationId,
    });
  }

  @SubscribeMessage('message:edit')
  async editMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageId: string; content: string }) {
    const message = await this.messagingService.updateMessage(client.data.userId, payload.messageId, payload.content);
    this.server.to(`conversation:${message.conversationId}`).emit('message:updated', message);
    return { ok: true, message };
  }

  @SubscribeMessage('message:delete')
  async deleteMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageId: string }) {
    const message = await this.prisma.message.findUnique({
      where: { id: payload.messageId },
      select: { conversationId: true },
    });
    const result = await this.messagingService.deleteMessage(client.data.userId, payload.messageId);
    if (message) {
      this.server.to(`conversation:${message.conversationId}`).emit('message:deleted', { id: result.id });
    }
    return { ok: true, ...result };
  }

  @SubscribeMessage('message:react')
  async reactToMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageId: string; reaction: string }) {
    const reaction = await this.messagingService.addReaction(client.data.userId, payload.messageId, payload.reaction);
    const message = await this.prisma.message.findUnique({
      where: { id: payload.messageId },
      select: { conversationId: true },
    });
    if (message) {
      this.server.to(`conversation:${message.conversationId}`).emit('message:reaction', reaction);
    }
    return { ok: true, reaction };
  }

  @SubscribeMessage('message:read')
  async readMessages(@ConnectedSocket() client: Socket, @MessageBody() payload: { messageIds: string[] }) {
    const messageIds = Array.from(new Set(payload?.messageIds ?? []));
    const result = await this.messagingService.markMessagesRead(client.data.userId, messageIds);

    if (messageIds.length) {
      const messages = await this.prisma.message.findMany({
        where: { id: { in: messageIds } },
        select: { id: true, conversationId: true },
      });
      const messagesByConversation = new Map<string, string[]>();
      for (const message of messages) {
        const ids = messagesByConversation.get(message.conversationId) ?? [];
        ids.push(message.id);
        messagesByConversation.set(message.conversationId, ids);
      }
      for (const [conversationId, ids] of messagesByConversation) {
        this.server.to(`conversation:${conversationId}`).emit('message:read', {
          userId: client.data.userId,
          messageIds: ids,
        });
      }
    }

    return { ok: true, ...result };
  }
}
