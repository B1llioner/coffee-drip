import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "@fastify/helmet";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/api-exception.filter";
import type { AppEnv } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }));
  const config = app.get(ConfigService<AppEnv, true>);

  await app.register(helmet, { contentSecurityPolicy: false });
  app.enableCors({
    origin: [config.get("PUBLIC_APP_URL", { infer: true }), config.get("ADMIN_APP_URL", { infer: true })],
    credentials: true,
  });
  app.setGlobalPrefix("api/v1", { exclude: ["healthz", "readyz"] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  const openApi = new DocumentBuilder()
    .setTitle("ALGI GROUP API")
    .setDescription("Каталог, заявки, заказы и администрирование ALGI GROUP")
    .setVersion("1.0")
    .build();
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, openApi));

  await app.listen({ port: config.get<number>("PORT", 4000), host: "0.0.0.0" });
}

void bootstrap();
