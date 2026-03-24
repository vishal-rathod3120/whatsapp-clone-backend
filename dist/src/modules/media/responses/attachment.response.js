"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentResponse = void 0;
class AttachmentResponse {
    constructor(attachment) {
        this.id = attachment.id;
        this.url = `/api/v1/media/${attachment.id}`;
        this.originalName = attachment.originalName;
        this.mimeType = attachment.mimeType;
        this.sizeBytes = attachment.sizeBytes.toString();
        this.width = attachment.width;
        this.height = attachment.height;
        this.durationSeconds = attachment.durationSeconds;
        this.thumbnailUrl = attachment.thumbnailKey
            ? `/api/v1/media/${attachment.id}/thumbnail`
            : undefined;
        this.createdAt = attachment.createdAt;
    }
}
exports.AttachmentResponse = AttachmentResponse;
//# sourceMappingURL=attachment.response.js.map