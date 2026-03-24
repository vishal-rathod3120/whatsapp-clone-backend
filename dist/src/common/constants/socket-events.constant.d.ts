export declare const SOCKET_EVENTS: {
    readonly CHAT: {
        readonly SEND: "chat:send";
        readonly SENT_ACK: "chat:sent-ack";
        readonly NEW: "chat:new";
        readonly DELIVERED: "chat:delivered";
        readonly DELIVERED_UPDATE: "chat:delivered:update";
        readonly SEEN: "chat:seen";
        readonly SEEN_UPDATE: "chat:seen:update";
        readonly TYPING_START: "chat:typing:start";
        readonly TYPING_STOP: "chat:typing:stop";
        readonly TYPING_UPDATE: "chat:typing:update";
        readonly ERROR: "chat:error";
    };
    readonly PRESENCE: {
        readonly UPDATE: "presence:update";
        readonly SUBSCRIBE: "presence:subscribe";
    };
    readonly CALL: {
        readonly INITIATE: "call:initiate";
        readonly INITIATED: "call:initiated";
        readonly INCOMING: "call:incoming";
        readonly ACCEPT: "call:accept";
        readonly ACCEPTED: "call:accepted";
        readonly REJECT: "call:reject";
        readonly REJECTED: "call:rejected";
        readonly END: "call:end";
        readonly ENDED: "call:ended";
        readonly TIMEOUT: "call:timeout";
        readonly CONNECTED: "call:connected";
        readonly OFFER: "call:offer";
        readonly ANSWER: "call:answer";
        readonly ICE_CANDIDATE: "call:ice-candidate";
        readonly ERROR: "call:error";
    };
};
