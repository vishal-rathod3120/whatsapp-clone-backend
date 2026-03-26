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
                        avatarUrl: string | null;
                        displayName: string;
                    };
                } & {
                    id: string;
                    userId: string;
                    role: import(".prisma/client").$Enums.ChatMemberRole;
                    joinedAt: Date;
                    leftAt: Date | null;
                    isMuted: boolean;
                    mutedUntil: Date | null;
                    isPinned: boolean;
                    wallpaperUrl: string | null;
                    lastReadMessageId: string | null;
                    chatId: string;
                })[];
            } & {
                id: string;
                type: import(".prisma/client").$Enums.ChatType;
                title: string | null;
                avatarUrl: string | null;
                createdById: string;
                lastMessageId: string | null;
                lastMessageAt: Date | null;
                disappearingTimer: number | null;
                createdAt: Date;
                updatedAt: Date;
            };
            caller: {
                id: string;
                avatarUrl: string | null;
                displayName: string;
            };
            participants: ({
                user: {
                    id: string;
                    avatarUrl: string | null;
                    displayName: string;
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
            type: import(".prisma/client").$Enums.CallType;
            createdAt: Date;
            chatId: string;
            status: import(".prisma/client").$Enums.CallStatus;
            startedAt: Date | null;
            answeredAt: Date | null;
            endedAt: Date | null;
            endReason: string | null;
            callerId: string;
        })[];
        nextCursor: string | null;
    }>;
    getCallById(callId: string, userId: string): Promise<{
        chat: {
            members: ({
                user: {
                    id: string;
                    avatarUrl: string | null;
                    displayName: string;
                };
            } & {
                id: string;
                userId: string;
                role: import(".prisma/client").$Enums.ChatMemberRole;
                joinedAt: Date;
                leftAt: Date | null;
                isMuted: boolean;
                mutedUntil: Date | null;
                isPinned: boolean;
                wallpaperUrl: string | null;
                lastReadMessageId: string | null;
                chatId: string;
            })[];
        } & {
            id: string;
            type: import(".prisma/client").$Enums.ChatType;
            title: string | null;
            avatarUrl: string | null;
            createdById: string;
            lastMessageId: string | null;
            lastMessageAt: Date | null;
            disappearingTimer: number | null;
            createdAt: Date;
            updatedAt: Date;
        };
        caller: {
            id: string;
            avatarUrl: string | null;
            displayName: string;
        };
        participants: ({
            user: {
                id: string;
                avatarUrl: string | null;
                displayName: string;
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
        type: import(".prisma/client").$Enums.CallType;
        createdAt: Date;
        chatId: string;
        status: import(".prisma/client").$Enums.CallStatus;
        startedAt: Date | null;
        answeredAt: Date | null;
        endedAt: Date | null;
        endReason: string | null;
        callerId: string;
    }>;
}
