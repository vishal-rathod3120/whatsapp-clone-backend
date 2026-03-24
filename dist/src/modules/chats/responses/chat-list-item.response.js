"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatListItemResponse = void 0;
class ChatListItemResponse {
    constructor(chat, unreadCount = 0) {
        this.id = chat.id;
        this.type = chat.type;
        this.title = chat.title;
        this.avatarUrl = chat.avatarUrl;
        this.lastMessage = chat.messages?.[0] ? {
            id: chat.messages[0].id,
            type: chat.messages[0].type,
            textContent: chat.messages[0].textContent,
            senderId: chat.messages[0].senderId,
            createdAt: chat.messages[0].createdAt,
        } : undefined;
        this.unreadCount = unreadCount;
        this.lastMessageAt = chat.lastMessageAt;
    }
}
exports.ChatListItemResponse = ChatListItemResponse;
//# sourceMappingURL=chat-list-item.response.js.map