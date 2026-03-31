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
                    joinedAt: Date;
                    leftAt: Date | null;
                    role: import(".prisma/client").$Enums.ChatMemberRole;
                    isMuted: boolean;
                    mutedUntil: Date | null;
                    isPinned: boolean;
                    isArchived: boolean;
                    wallpaperUrl: string | null;
                    lastReadMessageId: string | null;
                })[];
            } & {
                id: string;
                avatarUrl: string | null;
                createdAt: Date;
                updatedAt: Date;
                type: import(".prisma/client").$Enums.ChatType;
                title: string | null;
                description: string | null;
                createdById: string;
                communityId: string | null;
                isAnnouncement: boolean;
                lastMessageId: string | null;
                lastMessageAt: Date | null;
                disappearingTimer: number | null;
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
            status: import(".prisma/client").$Enums.CallStatus;
            startedAt: Date | null;
            answeredAt: Date | null;
            endedAt: Date | null;
            endReason: string | null;
            chatId: string;
            callerId: string;
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
                joinedAt: Date;
                leftAt: Date | null;
                role: import(".prisma/client").$Enums.ChatMemberRole;
                isMuted: boolean;
                mutedUntil: Date | null;
                isPinned: boolean;
                isArchived: boolean;
                wallpaperUrl: string | null;
                lastReadMessageId: string | null;
            })[];
        } & {
            id: string;
            avatarUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.ChatType;
            title: string | null;
            description: string | null;
            createdById: string;
            communityId: string | null;
            isAnnouncement: boolean;
            lastMessageId: string | null;
            lastMessageAt: Date | null;
            disappearingTimer: number | null;
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
        status: import(".prisma/client").$Enums.CallStatus;
        startedAt: Date | null;
        answeredAt: Date | null;
        endedAt: Date | null;
        endReason: string | null;
        chatId: string;
        callerId: string;
    }>;
}
