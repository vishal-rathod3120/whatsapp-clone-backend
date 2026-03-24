"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageResponse = void 0;
class MessageResponse {
    constructor(message) {
        this.id = message.id;
        this.chatId = message.chatId;
        this.senderId = message.senderId;
        this.clientTempId = message.clientTempId;
        this.type = message.type;
        this.textContent = message.textContent;
        this.status = message.status;
        this.createdAt = message.createdAt;
        this.editedAt = message.editedAt;
        this.isDeleted = message.isDeleted;
        if (message.attachment) {
            this.attachment = {
                id: message.attachment.id,
                url: `/api/v1/media/${message.attachment.id}`,
                mimeType: message.attachment.mimeType,
                sizeBytes: message.attachment.sizeBytes.toString(),
                width: message.attachment.width,
                height: message.attachment.height,
                durationSeconds: message.attachment.durationSeconds,
                thumbnailUrl: message.attachment.thumbnailKey
                    ? `/api/v1/media/${message.attachment.id}/thumbnail`
                    : undefined,
            };
        }
    }
}
exports.MessageResponse = MessageResponse;
//# sourceMappingURL=message.response.js.map