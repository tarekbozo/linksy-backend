"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: ['log', 'warn', 'error'] });
    app.use(require('express').json({ limit: '15mb' }));
    app.use(require('express').urlencoded({ limit: '15mb', extended: true }));
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", ...(process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)],
            },
        },
        hsts: process.env.NODE_ENV === 'production' ? undefined : false,
    }));
    app.use((0, cookie_parser_1.default)());
    const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'https://www.linksy.dev,http://localhost:3001')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.setGlobalPrefix('api/v1');
    const port = Number(process.env.PORT ?? 3000);
    await app.listen(port);
    console.log(`🚀 LinkSy API running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map