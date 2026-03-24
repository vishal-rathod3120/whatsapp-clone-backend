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
                    chatId: string;
                    userId: string;
                    leftAt: Date | null;
                    role: import(".prisma/client").$Enums.ChatMemberRole;
                    joinedAt: Date;
                    isMuted: boolean;
                    lastReadMessageId: string | null;
                })[];
            } & {
                id: string;
                type: import(".prisma/client").$Enums.ChatType;
                createdAt: Date;
                avatarUrl: string | null;
                updatedAt: Date;
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
                userId: string;
                leftAt: Date | null;
                joinedAt: Date | null;
                callId: string;
            })[];
        } & {
            id: string;
            chatId: string;
            callerId: string;
            type: import(".prisma/client").$Enums.CallType;
            status: import(".prisma/client").$Enums.CallStatus;
            startedAt: Date | null;
            answeredAt: Date | null;
            endedAt: Date | null;
            endReason: string | null;
            createdAt: Date;
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
                chatId: string;
                userId: string;
                leftAt: Date | null;
                role: import(".prisma/client").$Enums.ChatMemberRole;
                joinedAt: Date;
                isMuted: boolean;
                lastReadMessageId: string | null;
            })[];
        } & {
            id: string;
            type: import(".prisma/client").$Enums.ChatType;
            createdAt: Date;
            avatarUrl: string | null;
            updatedAt: Date;
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
            userId: string;
            leftAt: Date | null;
            joinedAt: Date | null;
            callId: string;
        })[];
    } & {
        id: string;
        chatId: string;
        callerId: string;
        type: import(".prisma/client").$Enums.CallType;
        status: import(".prisma/client").$Enums.CallStatus;
        startedAt: Date | null;
        answeredAt: Date | null;
        endedAt: Date | null;
        endReason: string | null;
        createdAt: Date;
    }>;
    getTurnCredentials(): Promise<{
        expiry: Date;
        username: string;
        credential: string;
        iceServers: import("../../integrations/turn/turn.service").TurnServer[];
    }>;
}
