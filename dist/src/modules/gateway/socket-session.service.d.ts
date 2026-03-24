import { PrismaService } from '../../prisma/prisma.service';
import { PresenceRepository } from '../../redis/presence.repository';
import { ChatsService } from '../chats/chats.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class SocketSessionService {
    private prisma;
    private presenceRepository;
    private chatsService;
    private notificationsService;
    private sessions;
    private userSockets;
    constructor(prisma: PrismaService, presenceRepository: PresenceRepository, chatsService: ChatsService, notificationsService: NotificationsService);
    registerSocket(userId: string, socketId: string): Promise<void>;
    removeSocket(socketId: string): Promise<void>;
    getUserIdBySocket(socketId: string): string | null;
    getUserSockets(userId: string): Promise<string[]>;
    addSession(socketId: string, session: {
        userId: string;
        deviceId: string;
        socket: any;
    }): void;
    getSession(socketId: string): {
        userId: string;
        deviceId: string;
        socket: any;
    } | undefined;
    removeSession(socketId: string): void;
}
