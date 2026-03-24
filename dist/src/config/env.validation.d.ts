declare class EnvironmentVariables {
    DATABASE_URL: string;
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    PORT?: string;
    NODE_ENV?: string;
}
export declare function validateEnv(config: Record<string, unknown>): EnvironmentVariables;
export {};
