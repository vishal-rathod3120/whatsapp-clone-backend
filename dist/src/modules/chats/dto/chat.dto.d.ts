import { ChatMemberRole } from '../../../common/enums';
export declare class CreateDirectChatDto {
    targetUserId: string;
}
export declare class MarkChatReadDto {
    lastReadMessageId?: string;
}
export declare class GetChatsQueryDto {
    limit?: number;
    cursor?: string;
}
export declare class CreateGroupChatDto {
    title: string;
    memberUserIds: string[];
    avatarUrl?: string;
}
export declare class AddMembersDto {
    userIds: string[];
}
export declare class UpdateMemberRoleDto {
    role: ChatMemberRole;
}
export declare class UpdateGroupDto {
    title?: string;
    avatarUrl?: string;
}
