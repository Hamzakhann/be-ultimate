import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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


  // 1. Connect AUDIT Microservice (Group 1)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] },
      consumer: {
        groupId: 'fintech-audit-consumer',
        allowAutoTopicCreation: true,
      }
    },
  });

  // 2. Connect NOTIFICATIONS Microservice (Group 2)
  // This ensures BOTH services get a copy of the 'transaction.events' message
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: { brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] },
      consumer: {
        groupId: 'fintech-notifications-group',
        allowAutoTopicCreation: true,
      }
    },
  });

  // Senior Tip: Add a small delay to let Kafka settle if topics are being auto-created
  console.log('Waiting for Kafka metadata to stabilize...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 2. Start Microservices
  await app.startAllMicroservices();
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