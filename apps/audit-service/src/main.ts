import { NestFactory } from '@nestjs/core';
import { AuditServiceModule } from './audit-service.module.js';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AuditServiceModule);
  const configService = app.get(ConfigService);

  // Kafka Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
      },
      consumer: {
        groupId: 'audit-service-consumer',
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

  await app.startAllMicroservices();
  
  const port = configService.get('PORT', 3005);
  await app.listen(port);
  
  logger.log(`🚀 Audit Service HTTP running on http://localhost:${port}/api/v1`);
  logger.log(`📡 Audit Service Kafka Consumer active`);
}
bootstrap();
