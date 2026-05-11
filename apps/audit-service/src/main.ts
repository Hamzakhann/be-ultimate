import { NestFactory } from '@nestjs/core';
import { AuditServiceModule } from './audit-service.module.js';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { createGlobalLogger } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AuditServiceModule, {
    logger: createGlobalLogger('audit-service'),
  });
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Kafka Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
        retry: {
          initialRetryTime: 1000,
          retries: 10,
        },
      },
      consumer: {
        groupId: 'audit-service-consumer',
        allowAutoTopicCreation: true,
      },
    },
  });

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  logger.log('Waiting for Kafka to stabilize...');
  await new Promise((r) => setTimeout(r, 3000));

  await app.startAllMicroservices();
  
  const port = configService.get('PORT', 3005);
  await app.listen(port);
  
  logger.log(`🚀 Audit Service HTTP running on http://localhost:${port}/api/v1`);
  logger.log(`📡 Audit Service Kafka Consumer active`);
}
bootstrap();
