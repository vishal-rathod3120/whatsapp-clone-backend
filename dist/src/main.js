"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const helmet_1 = require("helmet");
const compression = require("compression");
const path_1 = require("path");
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
BigInt.prototype.toJSON = function () {
    return this.toString();
};
async function bootstrap() {
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            abortOnError: false,
            logger: {
                log: console.log,
                error: console.error,
                warn: console.warn,
                debug: console.log,
                verbose: console.log,
                fatal: console.error,
            }
        });
        app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
            prefix: '/uploads',
        });
        app.use((0, helmet_1.default)({
            crossOriginResourcePolicy: { policy: "cross-origin" },
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "https:", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:", "blob:"],
                    connectSrc: ["'self'", "https:", "wss:", "ws:"],
                    fontSrc: ["'self'", "https:", "data:"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: [],
                },
            },
            referrerPolicy: { policy: 'same-origin' },
        }));
        app.use(compression());
        app.enableCors({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true,
        });
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }));
        const apiPrefix = process.env.API_PREFIX || '/api/v1';
        app.setGlobalPrefix(apiPrefix);
        const config = new swagger_1.DocumentBuilder()
            .setTitle('WhatsApp Clone API')
            .setDescription('Real-time messaging API with Socket.IO')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('docs', app, document);
        const port = process.env.PORT || 3000;
        await app.listen(port, '0.0.0.0');
        console.log(`Application running on: http://0.0.0.0:${port}`);
        console.log(`API docs available at: http://0.0.0.0:${port}/docs`);
    }
    catch (err) {
        console.error('FATAL BOOTSTRAP ERROR:', err);
        require('fs').writeFileSync('fatal.log', err.stack || err.toString());
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map