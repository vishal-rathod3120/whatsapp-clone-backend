import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { PrismaService } from '../../prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { SocketSessionService } from './socket-session.service';
import { ChatsService } from '../chats/chats.service';
import { MessagesService } from '../messages/messages.service';
import { PresenceRepository } from '../../redis/presence.repository';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthTokenService } from '../auth/auth-token.service';
import { SendMessageDto, DeliveredDto, SeenDto } from '../messages/dto/message.dto';
import { WsThrottlerGuard } from '../../common/guards/ws-throttler.guard';
import { MetricsService } from '../monitoring/metrics.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
@UseGuards(WsThrottlerGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private prisma: PrismaService,
    private socketSessionService: SocketSessionService,
    private chatsService: ChatsService,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
    private presenceRepository: PresenceRepository,
    private notificationsService: NotificationsService,
    private authTokenService: AuthTokenService,
    private metricsService: MetricsService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        socket.disconnect();
        return;
      }

      let payload;
      try {
        payload = await this.authTokenService.verifyAccessToken(token as string);
      } catch (err) {
        socket.disconnect();
        return;
      }

      const userId = payload.sub;
      if (!userId) {
        socket.disconnect();
        return;
      }

      // Register socket
      await this.socketSessionService.registerSocket(userId, socket.id);
      socket.join(`user:${userId}`);

      this.metricsService.activeConnections.inc();

      // Replay missed messages
      await this.replayMissedMessages(userId, socket);

      // Broadcast online status to mutual contacts
      const mutuals = await this.chatsService.getMutualContactIds(userId);
      mutuals.forEach(contactId => {
        this.server.to(`user:${contactId}`).emit('presence:update', {
          userId,
          status: 'online',
          lastSeen: null,
        });
      });
    } catch (error) {
      console.error('Socket connection error:', error);
      socket.disconnect();
    }
  }

  private async replayMissedMessages(userId: string, socket: Socket) {
    try {
      const presence = await this.presenceRepository.getUserPresence(userId);
      const lastSeen = presence.lastSeen || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24h ago
      
      // Fetch missed messages from all chats
      const missedMessages = await this.messagesService.getMissedMessages(userId, lastSeen);
      
      if (missedMessages.length > 0) {
        socket.emit('chat:missed-messages', {
          messages: missedMessages,
          count: missedMessages.length,
        });
      }
    } catch (error) {
      console.error('Replay missed messages error:', error);
    }
  }

  async handleDisconnect(socket: Socket) {
    this.metricsService.activeConnections.dec();

    const userId = this.socketSessionService.getUserIdBySocket(socket.id);
    
    await this.socketSessionService.removeSocket(socket.id);

    if (userId) {
      // Check if user is still online
      const sockets = await this.socketSessionService.getUserSockets(userId);
      if (sockets.length === 0) {
        const presence = await this.presenceRepository.getUserPresence(userId);
        const mutuals = await this.chatsService.getMutualContactIds(userId);
        mutuals.forEach(contactId => {
          this.server.to(`user:${contactId}`).emit('presence:update', {
            userId,
            status: 'offline',
            lastSeen: presence.lastSeen,
          });
        });
      }
    }

    console.log(`Socket ${socket.id} disconnected`);
  }

  @SubscribeMessage('chat:send')
  async handleSendMessage(socket: Socket, payload: SendMessageDto & { chatId: string }) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      // Verify chat membership & role
      const { chat, member } = await this.chatsService.getChatAndMember(payload.chatId, userId);
      if (!chat || !member) {
        socket.emit('chat:error', { message: 'Not a member of this chat' });
        return;
      }
      
      if ((chat.type === 'CHANNEL' || chat.isAnnouncement) && (member.role !== 'ADMIN' && member.role !== 'OWNER')) {
        socket.emit('chat:error', { message: 'Only admins can send messages here' });
        return;
      }

      // Create message
      const message = await this.messagesService.createMessage(payload.chatId, userId, {
        clientTempId: payload.clientTempId,
        type: payload.type,
        textContent: payload.textContent,
        attachmentId: payload.attachmentId,
        replyToMessageId: payload.replyToMessageId,
      });

      this.metricsService.incrementMessagesSent();

      // Acknowledge to sender
      socket.emit('chat:sent-ack', {
        clientTempId: payload.clientTempId,
        message,
      });

      // Get all recipient IDs
      const chatMembers = await this.prisma.chatMember.findMany({
        where: { chatId: payload.chatId, leftAt: null, userId: { not: userId } },
        select: { userId: true },
      });
      const recipientIds = chatMembers.map(m => m.userId);
      
      await Promise.all(recipientIds.map(async (recipientId) => {
        // Send to recipient's personal room
        this.server.to(`user:${recipientId}`).emit('chat:new', { message });

        // Always send silent push notification for background sync
        // Mobile OS layers freeze WebSockets when apps are backgrounded
        await this.notificationsService.sendSilentPushNotification(recipientId, {
          chatId: payload.chatId,
          messageId: message.id,
          type: 'message',
          senderId: userId,
          timestamp: new Date().toISOString(),
        });

        // Mark as delivered if recipient is online
        const recipientSockets = await this.socketSessionService.getUserSockets(recipientId);
        if (recipientSockets.length > 0) {
          await this.messagesService.markAsDelivered(message.id, recipientId);
          
          // Notify sender about delivery
          const senderSockets = await this.socketSessionService.getUserSockets(userId);
          senderSockets.forEach((socketId) => {
            this.server.to(socketId).emit('chat:delivered:update', {
              chatId: payload.chatId,
              messageId: message.id,
              userId: recipientId,
              deliveredAt: new Date(),
            });
          });

          // Always send a silent push to wake up backgrounded apps
          await this.notificationsService.sendSilentPushNotification(recipientId, {
            chatId: payload.chatId,
            messageId: message.id,
            type: 'message',
          });
        } else {
          // Send visible push notification since user is offline
          const isMuted = await this.chatsService.isChatMuted(payload.chatId, recipientId);
          if (!isMuted) {
            // Fetch sender info for notification
            const sender = await this.prisma.user.findUnique({
              where: { id: message.senderId },
              select: { displayName: true }
            });
            await this.notificationsService.sendPushNotification(recipientId, {
              title: sender?.displayName || 'New message',
              body: message.textContent || 'New message',
              data: {
                chatId: payload.chatId,
                messageId: message.id,
                type: 'message',
              },
            });
          }
        }
      }));
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('chat:delivered')
  async handleDelivered(socket: Socket, payload: DeliveredDto) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      const updated = await this.messagesService.markAsDelivered(payload.messageId, userId);
      
      if (updated) {
        // Get message sender
        const message = await this.messagesService.getMessageById(payload.messageId);
        
        // Notify sender
        this.server.to(`user:${message.senderId}`).emit('chat:delivered:update', {
          chatId: message.chatId,
          messageId: payload.messageId,
          userId,
          deliveredAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Delivered error:', error);
    }
  }

  @SubscribeMessage('chat:seen')
  async handleSeen(socket: Socket, payload: SeenDto) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      const updated = await this.messagesService.markAsSeen(payload.messageId, userId);
      
      if (updated) {
        // Get message sender
        const message = await this.messagesService.getMessageById(payload.messageId);
        
        // Notify sender
        this.server.to(`user:${message.senderId}`).emit('chat:seen:update', {
          chatId: payload.chatId,
          messageId: payload.messageId,
          seenBy: userId,
          seenAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Seen error:', error);
    }
  }

  @SubscribeMessage('chat:typing:start')
  async handleTypingStart(socket: Socket, payload: { chatId: string }) {
    const userId = this.socketSessionService.getUserIdBySocket(socket.id);
    if (!userId) return;

    await this.presenceRepository.setUserTyping(payload.chatId, userId);

    // Get recipient and notify
    const recipientId = await this.chatsService.getOtherMemberId(payload.chatId, userId);
    if (recipientId) {
      this.server.to(`user:${recipientId}`).emit('chat:typing:update', {
        chatId: payload.chatId,
        userId,
        isTyping: true,
      });
    }
  }

  @SubscribeMessage('chat:typing:stop')
  async handleTypingStop(socket: Socket, payload: { chatId: string }) {
    const userId = this.socketSessionService.getUserIdBySocket(socket.id);
    if (!userId) return;

    await this.presenceRepository.removeUserTyping(payload.chatId, userId);

    // Get recipient and notify
    const recipientId = await this.chatsService.getOtherMemberId(payload.chatId, userId);
    if (recipientId) {
      this.server.to(`user:${recipientId}`).emit('chat:typing:update', {
        chatId: payload.chatId,
        userId,
        isTyping: false,
      });
    }
  }

  @SubscribeMessage('chat:edit')
  async handleEditMessage(socket: Socket, payload: { chatId: string; messageId: string; textContent: string }) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      await this.messagesService.editMessage(payload.chatId, payload.messageId, userId, payload.textContent);
    } catch (error) {
      console.error('Edit message error:', error);
      socket.emit('chat:error', { message: 'Failed to edit message' });
    }
  }
  @SubscribeMessage('chat:react')
  async handleReaction(socket: Socket, payload: { chatId: string; messageId: string; emoji: string | null }) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      if (payload.emoji) {
        // Upsert reaction (one reaction per user per message)
        await this.prisma.messageReaction.upsert({
          where: { messageId_userId: { messageId: payload.messageId, userId } },
          create: { messageId: payload.messageId, userId, emoji: payload.emoji },
          update: { emoji: payload.emoji },
        });
      } else {
        // Remove reaction
        await this.prisma.messageReaction.deleteMany({
          where: { messageId: payload.messageId, userId },
        });
      }

      // Get all reactions for this message
      const reactions = await this.prisma.messageReaction.findMany({
        where: { messageId: payload.messageId },
        include: { user: { select: { id: true, displayName: true } } },
      });

      // Broadcast to all chat members
      const chat = await this.prisma.chat.findUnique({
        where: { id: payload.chatId },
        include: { members: { where: { leftAt: null }, select: { userId: true } } },
      });

      if (chat) {
        for (const member of chat.members) {
          this.server.to(`user:${member.userId}`).emit('message:reactions', {
            chatId: payload.chatId,
            messageId: payload.messageId,
            reactions,
          });
        }
      }
    } catch (error) {
      console.error('Reaction error:', error);
      socket.emit('chat:error', { message: 'Failed to react' });
    }
  }
  @SubscribeMessage('chat:key-request')
  async handleKeyRequest(socket: Socket, payload: { chatId: string; senderId: string }) {
    try {
      const userId = this.socketSessionService.getUserIdBySocket(socket.id);
      if (!userId) return;

      console.log(`Key request from ${userId} for ${payload.senderId} in chat ${payload.chatId}`);

      // Broadcast to the target sender's room
      this.server.to(`user:${payload.senderId}`).emit('chat:key-request', {
        chatId: payload.chatId,
        requesterId: userId,
      });
    } catch (error) {
      console.error('Key request error:', error);
    }
  }
}
