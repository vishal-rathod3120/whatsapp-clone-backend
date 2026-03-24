"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketUser = void 0;
const common_1 = require("@nestjs/common");
exports.SocketUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const client = ctx.switchToWs().getClient();
    const user = client.user;
    return data ? user?.[data] : user;
});
//# sourceMappingURL=socket-user.decorator.js.map