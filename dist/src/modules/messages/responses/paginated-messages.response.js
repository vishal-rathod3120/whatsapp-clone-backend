"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedMessagesResponse = void 0;
const message_response_1 = require("./message.response");
class PaginatedMessagesResponse {
    constructor(messages, nextCursor = null) {
        this.items = messages.map((m) => new message_response_1.MessageResponse(m));
        this.nextCursor = nextCursor;
    }
}
exports.PaginatedMessagesResponse = PaginatedMessagesResponse;
//# sourceMappingURL=paginated-messages.response.js.map