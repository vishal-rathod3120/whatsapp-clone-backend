export declare const SocketEvents: {
    readonly CLIENT_TO_SERVER: {
        readonly CHAT_SEND: "chat:send";
        readonly CHAT_DELIVERED: "chat:delivered";
        readonly CHAT_SEEN: "chat:seen";
        readonly TYPING_START: "chat:typing:start";
        readonly TYPING_STOP: "chat:typing:stop";
        readonly CALL_INITIATE: "call:initiate";
        readonly CALL_ACCEPT: "call:accept";
        readonly CALL_REJECT: "call:reject";
        readonly CALL_END: "call:end";
        readonly CALL_OFFER: "call:offer";
        readonly CALL_ANSWER: "call:answer";
        readonly CALL_ICE_CANDIDATE: "call:ice-candidate";
        readonly PRESENCE_SUBSCRIBE: "presence:subscribe";
    };
    readonly SERVER_TO_CLIENT: {
        readonly CHAT_NEW: "chat:new";
        readonly CHAT_SENT_ACK: "chat:sent-ack";
        readonly CHAT_DELIVERED_UPDATE: "chat:delivered:update";
        readonly CHAT_SEEN_UPDATE: "chat:seen:update";
        readonly TYPING_UPDATE: "chat:typing:update";
        readonly PRESENCE_UPDATE: "presence:update";
        readonly CALL_INCOMING: "call:incoming";
        readonly CALL_ACCEPTED: "call:accepted";
        readonly CALL_REJECTED: "call:rejected";
        readonly CALL_ENDED: "call:ended";
        readonly CALL_TIMEOUT: "call:timeout";
    };
};
