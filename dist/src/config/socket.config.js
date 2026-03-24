"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('socket', () => ({
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || '*',
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000', 10) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10) || 25000,
}));
//# sourceMappingURL=socket.config.js.map