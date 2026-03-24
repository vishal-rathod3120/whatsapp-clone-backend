export declare const appConfig: (() => {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    corsOrigin: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    corsOrigin: string;
}>;
export declare const databaseConfig: (() => {
    url: string | undefined;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    url: string | undefined;
}>;
export declare const jwtConfig: (() => {
    secret: string | undefined;
    refreshSecret: string | undefined;
    expiration: string;
    refreshExpiration: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secret: string | undefined;
    refreshSecret: string | undefined;
    expiration: string;
    refreshExpiration: string;
}>;
export declare const redisConfig: (() => {
    host: string;
    port: number;
    password: string | undefined;
    db: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string | undefined;
    db: number;
}>;
export declare const storageConfig: (() => {
    type: string;
    bucket: string | undefined;
    region: string | undefined;
    accessKey: string | undefined;
    secretKey: string | undefined;
    endpoint: string | undefined;
    publicUrl: string | undefined;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    type: string;
    bucket: string | undefined;
    region: string | undefined;
    accessKey: string | undefined;
    secretKey: string | undefined;
    endpoint: string | undefined;
    publicUrl: string | undefined;
}>;
export declare const pushConfig: (() => {
    fcmProjectId: string | undefined;
    fcmClientEmail: string | undefined;
    fcmPrivateKey: string | undefined;
    apnsKeyId: string | undefined;
    apnsTeamId: string | undefined;
    apnsBundleId: string | undefined;
    apnsPrivateKeyPath: string | undefined;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    fcmProjectId: string | undefined;
    fcmClientEmail: string | undefined;
    fcmPrivateKey: string | undefined;
    apnsKeyId: string | undefined;
    apnsTeamId: string | undefined;
    apnsBundleId: string | undefined;
    apnsPrivateKeyPath: string | undefined;
}>;
export declare const callConfig: (() => {
    timeoutSeconds: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    timeoutSeconds: number;
}>;
