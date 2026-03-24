import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PresenceRepository } from '../../redis/presence.repository';
import { ChatsService } from '../chats/chats.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SocketSessionService {
  // Map socketId to session info
  private sessions: Map<string, { userId: string; deviceId: string; socket: any }> = new Map();
  // Map socketId to user info
  private userSockets: Map<string, { userId: string; socketId: string }> = new Map();

  constructor(
    private prisma: PrismaService,
    private presenceRepository: PresenceRepository,
    private chatsService: ChatsService,
    private messagesService: MessagesService,
    private notificationsService: NotificationsService,
  ) {}

  async registerSocket(userId: string, socketId: string): Promise<void> {
    this.userSockets.set(socketId, { userId, socketId });
    await this.presenceRepository.addUserSocket(userId, socketId);
    await this.presenceRepository.setUserOnline(userId);
  }

  async removeSocket(socketId: string): Promise<void> {
    const userInfo = this.userSockets.get(socketId);
    if (userInfo) {
      this.userSockets.delete(socketId);
      await this.presenceRepository.removeUserSocket(userInfo.userId, socketId);

      // Check if user has any other active sockets
      const remainingSockets = await this.presenceRepository.getUserSockets(userInfo.userId);
      if (remainingSockets.length === 0) {
        await this.presenceRepository.setUserOffline(userInfo.userId);
      }
    }
  }

  getUserIdBySocket(socketId: string): string | null {
    return this.userSockets.get(socketId)?.userId || null;
  }

  async getUserSockets(userId: string): Promise<string[]> {
    return this.presenceRepository.getUserSockets(userId);
  }

  addSession(socketId: string, session: { userId: string; deviceId: string; socket: any }): void {
    this.sessions.set(socketId, session);
  }

  getSession(socketId: string): { userId: string; deviceId: string; socket: any } | undefined {
    return this.sessions.get(socketId);
  }

  removeSession(socketId: string): void {
    this.sessions.delete(socketId);
  }
}
