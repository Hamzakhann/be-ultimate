import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global route prefix for auth-service
  app.setGlobalPrefix('api/v1');

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

  // Hybrid Application: HTTP + TCP
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3001,
    },
  });

  await app.startAllMicroservices();
  const port = (process.env.PORT ? parseInt(process.env.PORT) : 3001) + 100;
  await app.listen(port);
  console.log(`🚀 Auth Service HTTP running on http://localhost:${port}/api/v1/auth`);
  console.log(`📡 Auth Service TCP Microservice running on port 3001`);
}

bootstrap();
