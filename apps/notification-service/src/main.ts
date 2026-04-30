import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module.js';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);
  const configService = app.get(ConfigService);

  // Kafka Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
      },
      consumer: {
        groupId: 'notification-service-consumer',
      },
    },
  });

  await app.startAllMicroservices();
  
  const port = configService.get('PORT', 3004);
  app.setGlobalPrefix('api');
  await app.listen(port);
  
  console.log(`🚀 Notification Service HTTP running on http://localhost:${port}/api`);
  console.log(`📡 Notification Service Kafka Consumer active`);
}
bootstrap();
