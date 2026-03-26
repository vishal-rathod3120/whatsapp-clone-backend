import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { PrismaService } from '../../prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { SocketSessionService } from './socket-session.service';
import { ChatsService } from '../chats/chats.service';
import { MessagesService } from '../messages/messages.service';
import { PresenceRepository } from '../../redis/presence.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthTokenService } from '../auth/auth-token.service';
import { SendMessageDto, DeliveredDto, SeenDto } from '../messages/dto/message.dto';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private prisma;
    private socketSessionService;
    private chatsService;
    private messagesService;
    private presenceRepository;
    private notificationsService;
    private authTokenService;
    server: Server;
    constructor(prisma: PrismaService, socketSessionService: SocketSessionService, chatsService: ChatsService, messagesService: MessagesService, presenceRepository: PresenceRepository, notificationsService: NotificationsService, authTokenService: AuthTokenService);
    handleConnection(socket: Socket): Promise<void>;
    private replayMissedMessages;
    handleDisconnect(socket: Socket): Promise<void>;
    handleSendMessage(socket: Socket, payload: SendMessageDto & {
        chatId: string;
    }): Promise<void>;
    handleDelivered(socket: Socket, payload: DeliveredDto): Promise<void>;
    handleSeen(socket: Socket, payload: SeenDto): Promise<void>;
    handleTypingStart(socket: Socket, payload: {
        chatId: string;
    }): Promise<void>;
    handleTypingStop(socket: Socket, payload: {
        chatId: string;
    }): Promise<void>;
    handleEditMessage(socket: Socket, payload: {
        chatId: string;
        messageId: string;
        textContent: string;
    }): Promise<void>;
    handleReaction(socket: Socket, payload: {
        chatId: string;
        messageId: string;
        emoji: string | null;
    }): Promise<void>;
}
