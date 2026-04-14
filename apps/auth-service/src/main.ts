import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global route prefix for auth-service
  app.setGlobalPrefix('api/v1/auth');

  // Validate all incoming DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,        // Auto-transform primitives (e.g. string → number)
    }),
  );

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('Auth Service')
    .setDescription('Authentication microservice API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/auth/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Auth Service running on http://localhost:${port}/api/v1/auth`);
}

bootstrap();
