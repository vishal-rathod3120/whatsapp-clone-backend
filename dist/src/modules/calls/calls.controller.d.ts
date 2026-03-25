import { CallsService } from './calls.service';
import { TurnService } from '../../integrations/turn/turn.service';
import { JwtPayload } from '../auth/types/jwt-payload.type';
export declare class CallsController {
    private callsService;
    private turnService;
    constructor(callsService: CallsService, turnService: TurnService);
    getCalls(limit?: number, cursor?: string, user?: JwtPayload): Promise<{
        items: ({
            chat: {
                members: ({
                    user: {
                        id: string;
                        displayName: string;
                        avatarUrl: string | null;
                    };
                } & {
                    id: string;
                    role: import(".prisma/client").$Enums.ChatMemberRole;
                    joinedAt: Date;
                    leftAt: Date | null;
                    isMuted: boolean;
                    lastReadMessageId: string | null;
                    userId: string;
                    chatId: string;
                })[];
            } & {
                id: string;
                avatarUrl: string | null;
                createdAt: Date;
                updatedAt: Date;
                type: import(".prisma/client").$Enums.ChatType;
                title: string | null;
                createdById: string;
                lastMessageId: string | null;
                lastMessageAt: Date | null;
            };
            caller: {
                id: string;
                displayName: string;
                avatarUrl: string | null;
            };
            participants: ({
                user: {
                    id: string;
                    displayName: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                joinedAt: Date | null;
                leftAt: Date | null;
                userId: string;
                callId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.CallType;
            status: import(".prisma/client").$Enums.CallStatus;
            chatId: string;
            callerId: string;
            startedAt: Date | null;
            answeredAt: Date | null;
            endedAt: Date | null;
            endReason: string | null;
        })[];
        nextCursor: string | null;
    }>;
    getCallById(callId: string, user?: JwtPayload): Promise<{
        chat: {
            members: ({
                user: {
                    id: string;
                    displayName: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                role: import(".prisma/client").$Enums.ChatMemberRole;
                joinedAt: Date;
                leftAt: Date | null;
                isMuted: boolean;
                lastReadMessageId: string | null;
                userId: string;
                chatId: string;
            })[];
        } & {
            id: string;
            avatarUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.ChatType;
            title: string | null;
            createdById: string;
            lastMessageId: string | null;
            lastMessageAt: Date | null;
        };
        caller: {
            id: string;
            displayName: string;
            avatarUrl: string | null;
        };
        participants: ({
            user: {
                id: string;
                displayName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            joinedAt: Date | null;
            leftAt: Date | null;
            userId: string;
            callId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.CallType;
        status: import(".prisma/client").$Enums.CallStatus;
        chatId: string;
        callerId: string;
        startedAt: Date | null;
        answeredAt: Date | null;
        endedAt: Date | null;
        endReason: string | null;
    }>;
    getTurnCredentials(): Promise<{
        expiry: Date;
        username: string;
        credential: string;
        iceServers: import("../../integrations/turn/turn.service").TurnServer[];
    }>;
}
