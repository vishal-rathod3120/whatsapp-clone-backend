import { Server, Socket } from 'socket.io';
import { SocketSessionService } from './socket-session.service';
import { PresenceRepository } from '../../redis/presence.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CallType } from '../../common/enums';
interface WebRTCPayload {
    callId: string;
    sdp?: string;
    candidate?: RTCIceCandidate;
}
export declare class CallGateway {
    private socketSessionService;
    private presenceRepository;
    private prisma;
    server: Server;
    constructor(socketSessionService: SocketSessionService, presenceRepository: PresenceRepository, prisma: PrismaService);
    handleCallInitiate(socket: Socket, payload: {
        chatId: string;
        type: CallType;
    }): Promise<void>;
    handleCallAccept(socket: Socket, payload: {
        callId: string;
    }): Promise<void>;
    handleCallReject(socket: Socket, payload: {
        callId: string;
        reason?: string;
    }): Promise<void>;
    handleCallEnd(socket: Socket, payload: {
        callId: string;
        reason?: string;
    }): Promise<void>;
    handleOffer(socket: Socket, payload: WebRTCPayload): void;
    handleAnswer(socket: Socket, payload: WebRTCPayload): void;
    handleIceCandidate(socket: Socket, payload: WebRTCPayload): void;
    private forwardSignaling;
}
export {};
