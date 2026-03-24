"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallStatus = exports.CallType = exports.MessageStatus = exports.MessageType = exports.ChatMemberRole = exports.ChatType = exports.DeviceType = void 0;
var DeviceType;
(function (DeviceType) {
    DeviceType["ANDROID"] = "ANDROID";
    DeviceType["IOS"] = "IOS";
    DeviceType["WEB"] = "WEB";
    DeviceType["DESKTOP"] = "DESKTOP";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var ChatType;
(function (ChatType) {
    ChatType["DIRECT"] = "DIRECT";
    ChatType["GROUP"] = "GROUP";
})(ChatType || (exports.ChatType = ChatType = {}));
var ChatMemberRole;
(function (ChatMemberRole) {
    ChatMemberRole["MEMBER"] = "MEMBER";
    ChatMemberRole["ADMIN"] = "ADMIN";
    ChatMemberRole["OWNER"] = "OWNER";
})(ChatMemberRole || (exports.ChatMemberRole = ChatMemberRole = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "TEXT";
    MessageType["IMAGE"] = "IMAGE";
    MessageType["FILE"] = "FILE";
    MessageType["AUDIO"] = "AUDIO";
    MessageType["VIDEO"] = "VIDEO";
    MessageType["SYSTEM"] = "SYSTEM";
})(MessageType || (exports.MessageType = MessageType = {}));
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["SENT"] = "SENT";
    MessageStatus["DELIVERED"] = "DELIVERED";
    MessageStatus["SEEN"] = "SEEN";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
var CallType;
(function (CallType) {
    CallType["AUDIO"] = "AUDIO";
    CallType["VIDEO"] = "VIDEO";
})(CallType || (exports.CallType = CallType = {}));
var CallStatus;
(function (CallStatus) {
    CallStatus["RINGING"] = "RINGING";
    CallStatus["ACCEPTED"] = "ACCEPTED";
    CallStatus["REJECTED"] = "REJECTED";
    CallStatus["MISSED"] = "MISSED";
    CallStatus["ENDED"] = "ENDED";
    CallStatus["FAILED"] = "FAILED";
})(CallStatus || (exports.CallStatus = CallStatus = {}));
//# sourceMappingURL=index.js.map