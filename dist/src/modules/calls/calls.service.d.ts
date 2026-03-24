import { PrismaService } from '../../prisma/prisma.service';
export declare class CallsService {
    private prisma;
    constructor(prisma: PrismaService);
    getCallsByUser(userId: string, limit?: number, cursor?: string): Promise<{
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
                    userId: string;
                    chatId: string;
                    role: import(".prisma/client").$Enums.ChatMemberRole;
                    joinedAt: Date;
                    leftAt: Date | null;
                    isMuted: boolean;
                    lastReadMessageId: string | null;
                })[];
            } & {
                id: string;
                createdAt: Date;
                title: string | null;
                type: import(".prisma/client").$Enums.ChatType;
                avatarUrl: string | null;
                updatedAt: Date;
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
                joinedAt: Date | null;
                leftAt: Date | null;
                callId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.CallType;
            chatId: string;
            status: import(".prisma/client").$Enums.CallStatus;
            callerId: string;
            startedAt: Date | null;
            answeredAt: Date | null;
            endedAt: Date | null;
            endReason: string | null;
        })[];
        nextCursor: string | null;
    }>;
    getCallById(callId: string, userId: string): Promise<{
        chat: {
            members: ({
                user: {
                    id: string;
                    displayName: string;
                    avatarUrl: string | null;
                };
            } & {
                id: string;
                userId: string;
                chatId: string;
                role: import(".prisma/client").$Enums.ChatMemberRole;
                joinedAt: Date;
                leftAt: Date | null;
                isMuted: boolean;
                lastReadMessageId: string | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            title: string | null;
            type: import(".prisma/client").$Enums.ChatType;
            avatarUrl: string | null;
            updatedAt: Date;
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
            joinedAt: Date | null;
            leftAt: Date | null;
            callId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.CallType;
        chatId: string;
        status: import(".prisma/client").$Enums.CallStatus;
        callerId: string;
        startedAt: Date | null;
        answeredAt: Date | null;
        endedAt: Date | null;
        endReason: string | null;
    }>;
}
