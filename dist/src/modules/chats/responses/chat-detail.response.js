"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatDetailResponse = void 0;
class ChatDetailResponse {
    constructor(chat) {
        this.id = chat.id;
        this.type = chat.type;
        this.title = chat.title;
        this.avatarUrl = chat.avatarUrl;
        this.createdById = chat.createdById;
        this.createdAt = chat.createdAt;
        this.members = chat.members?.map((member) => ({
            userId: member.userId,
            displayName: member.user?.displayName,
            avatarUrl: member.user?.avatarUrl,
            role: member.role,
        })) || [];
    }
}
exports.ChatDetailResponse = ChatDetailResponse;
//# sourceMappingURL=chat-detail.response.js.map