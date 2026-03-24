import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || '*',
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiration: process.env.JWT_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10) || 0,
}));

export const storageConfig = registerAs('storage', () => ({
  type: process.env.STORAGE_TYPE || 'local',
  bucket: process.env.STORAGE_BUCKET,
  region: process.env.STORAGE_REGION,
  accessKey: process.env.STORAGE_ACCESS_KEY,
  secretKey: process.env.STORAGE_SECRET_KEY,
  endpoint: process.env.STORAGE_ENDPOINT,
  publicUrl: process.env.STORAGE_PUBLIC_URL,
}));

export const pushConfig = registerAs('push', () => ({
  fcmProjectId: process.env.FCM_PROJECT_ID,
  fcmClientEmail: process.env.FCM_CLIENT_EMAIL,
  fcmPrivateKey: process.env.FCM_PRIVATE_KEY,
  apnsKeyId: process.env.APNS_KEY_ID,
  apnsTeamId: process.env.APNS_TEAM_ID,
  apnsBundleId: process.env.APNS_BUNDLE_ID,
  apnsPrivateKeyPath: process.env.APNS_PRIVATE_KEY_PATH,
}));

export const callConfig = registerAs('call', () => ({
  timeoutSeconds: parseInt(process.env.CALL_TIMEOUT_SECONDS || '30', 10) || 30,
}));
