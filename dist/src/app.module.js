"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const chats_module_1 = require("./modules/chats/chats.module");
const messages_module_1 = require("./modules/messages/messages.module");
const media_module_1 = require("./modules/media/media.module");
const calls_module_1 = require("./modules/calls/calls.module");
const gateway_module_1 = require("./modules/gateway/gateway.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const presence_module_1 = require("./modules/presence/presence.module");
const jobs_module_1 = require("./jobs/jobs.module");
const health_module_1 = require("./health/health.module");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const config_2 = require("./config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [config_2.appConfig, config_2.databaseConfig, config_2.jwtConfig, config_2.redisConfig, config_2.storageConfig],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 10,
                },
            ]),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            jobs_module_1.JobsModule,
            presence_module_1.PresenceModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            chats_module_1.ChatsModule,
            messages_module_1.MessagesModule,
            media_module_1.MediaModule,
            calls_module_1.CallsModule,
            gateway_module_1.GatewayModule,
            notifications_module_1.NotificationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map