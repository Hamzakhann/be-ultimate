import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Fintech API')
    .setDescription('The Fintech Platform API description')
    .setVersion('1.0')
    .addBearerAuth() // Adds JWT support to Swagger UI
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enable Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Strip away data that doesn't have a DTO
    forbidNonWhitelisted: true,
    transform: true,        // Automatically transform payloads to DTO instances
  }));

  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
}
bootstrap();