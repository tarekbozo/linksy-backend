import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "warn", "error"],
  });

  app.use(require("express").json({ limit: "15mb" }));
  app.use(require("express").urlencoded({ limit: "15mb", extended: true }));

  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: [
            "'self'",
            ...(process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
          ],
        },
      },
      hsts: process.env.NODE_ENV === "production" ? undefined : false,
    }),
  );

  app.use(cookieParser());

  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ??
    "https://www.linksy.dev,http://localhost:3001"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "x-internal-session",
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix("api/v1");

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`🚀 LinkSy API running on port ${port}`);
}

bootstrap();
