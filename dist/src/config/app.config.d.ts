declare const _default: (() => {
    name: string;
    port: number;
    env: string;
    apiPrefix: string;
    corsOrigins: string[];
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    name: string;
    port: number;
    env: string;
    apiPrefix: string;
    corsOrigins: string[];
}>;
export default _default;
