"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallResponse = void 0;
class CallResponse {
    constructor(call) {
        this.id = call.id;
        this.chatId = call.chatId;
        this.callerId = call.callerId;
        this.type = call.type;
        this.status = call.status;
        this.startedAt = call.startedAt;
        this.answeredAt = call.answeredAt;
        this.endedAt = call.endedAt;
        this.endReason = call.endReason;
        this.createdAt = call.createdAt;
        this.participants = call.participants?.map((p) => ({
            userId: p.userId,
            joinedAt: p.joinedAt,
            leftAt: p.leftAt,
        })) || [];
    }
}
exports.CallResponse = CallResponse;
//# sourceMappingURL=call.response.js.map