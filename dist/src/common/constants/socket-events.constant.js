"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = void 0;
exports.SOCKET_EVENTS = {
    CHAT: {
        SEND: 'chat:send',
        SENT_ACK: 'chat:sent-ack',
        NEW: 'chat:new',
        DELIVERED: 'chat:delivered',
        DELIVERED_UPDATE: 'chat:delivered:update',
        SEEN: 'chat:seen',
        SEEN_UPDATE: 'chat:seen:update',
        TYPING_START: 'chat:typing:start',
        TYPING_STOP: 'chat:typing:stop',
        TYPING_UPDATE: 'chat:typing:update',
        ERROR: 'chat:error',
    },
    PRESENCE: {
        UPDATE: 'presence:update',
        SUBSCRIBE: 'presence:subscribe',
    },
    CALL: {
        INITIATE: 'call:initiate',
        INITIATED: 'call:initiated',
        INCOMING: 'call:incoming',
        ACCEPT: 'call:accept',
        ACCEPTED: 'call:accepted',
        REJECT: 'call:reject',
        REJECTED: 'call:rejected',
        END: 'call:end',
        ENDED: 'call:ended',
        TIMEOUT: 'call:timeout',
        CONNECTED: 'call:connected',
        OFFER: 'call:offer',
        ANSWER: 'call:answer',
        ICE_CANDIDATE: 'call:ice-candidate',
        ERROR: 'call:error',
    },
};
//# sourceMappingURL=socket-events.constant.js.map