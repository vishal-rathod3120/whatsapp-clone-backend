import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PresenceService } from './presence.service';
import { SocketSessionService } from '../gateway/socket-session.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: 'presence',
  cors: {
    origin: '*',
  },
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PresenceGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly presenceService: PresenceService,
    private readonly socketSession: SocketSessionService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.userId as string;
      const deviceId = payload.deviceId as string;

      this.socketSession.addSession(client.id, { userId, deviceId, socket: client });
      await this.presenceService.setUserOnline(userId, client.id);

      // Join personal room for targeted events
      client.join(`user:${userId}`);

      // Broadcast online status to subscribers
      this.broadcastPresenceUpdate(userId, 'online');

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const session = this.socketSession.getSession(client.id);
    if (session) {
      await this.presenceService.setUserOffline(session.userId, client.id);
      this.socketSession.removeSession(client.id);
      this.broadcastPresenceUpdate(session.userId, 'offline');
      this.logger.log(`User ${session.userId} disconnected`);
    }
  }

  @SubscribeMessage('presence:subscribe')
  async handleSubscribe(client: Socket, userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      client.join(`presence:${userId}`);
    }
  }

  @SubscribeMessage('presence:unsubscribe')
  async handleUnsubscribe(client: Socket, userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      client.leave(`presence:${userId}`);
    }
  }

  @SubscribeMessage('chat:typing:start')
  async handleTypingStart(client: Socket, data: { chatId: string }): Promise<void> {
    const session = this.socketSession.getSession(client.id);
    if (!session) return;

    await this.presenceService.setTyping(data.chatId, session.userId, true);
    client.to(`chat:${data.chatId}`).emit('chat:typing:update', {
      chatId: data.chatId,
      userId: session.userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('chat:typing:stop')
  async handleTypingStop(client: Socket, data: { chatId: string }): Promise<void> {
    const session = this.socketSession.getSession(client.id);
    if (!session) return;

    await this.presenceService.setTyping(data.chatId, session.userId, false);
    client.to(`chat:${data.chatId}`).emit('chat:typing:update', {
      chatId: data.chatId,
      userId: session.userId,
      isTyping: false,
    });
  }

  private broadcastPresenceUpdate(userId: string, status: 'online' | 'offline'): void {
    this.server.to(`presence:${userId}`).emit('presence:update', {
      userId,
      status,
      lastSeen: status === 'offline' ? new Date().toISOString() : null,
    });
  }
}
