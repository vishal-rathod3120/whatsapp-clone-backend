"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayModule = void 0;
const common_1 = require("@nestjs/common");
const chat_gateway_1 = require("./chat.gateway");
const call_gateway_1 = require("./call.gateway");
const socket_session_service_1 = require("./socket-session.service");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_service_1 = require("../../redis/redis.service");
const auth_module_1 = require("../auth/auth.module");
let GatewayModule = class GatewayModule {
    constructor(redisService) {
        this.redisService = redisService;
        this.redisIoAdapter = new RedisIoAdapter(redisService);
    }
    createIOServer(port, options) {
        return this.redisIoAdapter.createIOServer(port, options);
    }
};
exports.GatewayModule = GatewayModule;
exports.GatewayModule = GatewayModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        providers: [chat_gateway_1.ChatGateway, call_gateway_1.CallGateway, socket_session_service_1.SocketSessionService],
        exports: [socket_session_service_1.SocketSessionService],
    }),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], GatewayModule);
class RedisIoAdapter extends platform_socket_io_1.IoAdapter {
    constructor(redisService) {
        super();
        this.redisService = redisService;
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, options);
        const pubClient = this.redisService.getClient();
        const subClient = pubClient.duplicate();
        server.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        return server;
    }
}
//# sourceMappingURL=gateway.module.js.map