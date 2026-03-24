import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PresenceService } from './presence.service';
import { SocketSessionService } from '../gateway/socket-session.service';
import { JwtService } from '@nestjs/jwt';
export declare class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly presenceService;
    private readonly socketSession;
    private readonly jwtService;
    private readonly logger;
    server: Server;
    constructor(presenceService: PresenceService, socketSession: SocketSessionService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleSubscribe(client: Socket, userIds: string[]): Promise<void>;
    handleUnsubscribe(client: Socket, userIds: string[]): Promise<void>;
    handleTypingStart(client: Socket, data: {
        chatId: string;
    }): Promise<void>;
    handleTypingStop(client: Socket, data: {
        chatId: string;
    }): Promise<void>;
    private broadcastPresenceUpdate;
}
