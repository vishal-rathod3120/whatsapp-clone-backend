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
import { NotificationsService } from '../notifications/notifications.service';
import { AuthTokenService } from '../auth/auth-token.service';
import { SendMessageDto, DeliveredDto, SeenDto } from '../messages/dto/message.dto';
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private socketSessionService: SocketSessionService,
    private chatsService: ChatsService,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
    private presenceRepository: PresenceRepository,
    private notificationsService: NotificationsService,
    private authTokenService: AuthTokenService,
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

      // Verify chat membership
      const isMember = await this.chatsService.isChatMember(payload.chatId, userId);
      if (!isMember) {
        socket.emit('chat:error', { message: 'Not a member of this chat' });
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

      // Acknowledge to sender
      socket.emit('chat:sent-ack', {
        clientTempId: payload.clientTempId,
        message,
      });

      // Get recipient ID
      const recipientId = await this.chatsService.getOtherMemberId(payload.chatId, userId);
      
      if (recipientId) {
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
            await this.notificationsService.sendPushNotification(recipientId, {
              title: message.sender.displayName,
              body: message.textContent || 'New message',
              data: {
                chatId: payload.chatId,
                messageId: message.id,
                type: 'message',
              },
            });
          }
        }
      }
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
}
