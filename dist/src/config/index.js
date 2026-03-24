"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callConfig = exports.pushConfig = exports.storageConfig = exports.redisConfig = exports.jwtConfig = exports.databaseConfig = exports.appConfig = void 0;
const config_1 = require("@nestjs/config");
exports.appConfig = (0, config_1.registerAs)('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10) || 3000,
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    corsOrigin: process.env.CORS_ORIGIN || '*',
}));
exports.databaseConfig = (0, config_1.registerAs)('database', () => ({
    url: process.env.DATABASE_URL,
}));
exports.jwtConfig = (0, config_1.registerAs)('jwt', () => ({
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiration: process.env.JWT_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
exports.redisConfig = (0, config_1.registerAs)('redis', () => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10) || 0,
}));
exports.storageConfig = (0, config_1.registerAs)('storage', () => ({
    type: process.env.STORAGE_TYPE || 'local',
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
    endpoint: process.env.STORAGE_ENDPOINT,
    publicUrl: process.env.STORAGE_PUBLIC_URL,
}));
exports.pushConfig = (0, config_1.registerAs)('push', () => ({
    fcmProjectId: process.env.FCM_PROJECT_ID,
    fcmClientEmail: process.env.FCM_CLIENT_EMAIL,
    fcmPrivateKey: process.env.FCM_PRIVATE_KEY,
    apnsKeyId: process.env.APNS_KEY_ID,
    apnsTeamId: process.env.APNS_TEAM_ID,
    apnsBundleId: process.env.APNS_BUNDLE_ID,
    apnsPrivateKeyPath: process.env.APNS_PRIVATE_KEY_PATH,
}));
exports.callConfig = (0, config_1.registerAs)('call', () => ({
    timeoutSeconds: parseInt(process.env.CALL_TIMEOUT_SECONDS || '30', 10) || 30,
}));
//# sourceMappingURL=index.js.map