"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSocketAuthMiddleware = createSocketAuthMiddleware;
function createSocketAuthMiddleware(jwtService) {
    return (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: Token missing'));
            }
            const payload = jwtService.verify(token);
            socket.data.userId = payload.userId;
            socket.data.deviceId = payload.deviceId;
            next();
        }
        catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    };
}
//# sourceMappingURL=socket.auth.js.map