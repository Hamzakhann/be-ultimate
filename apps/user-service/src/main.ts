import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Hybrid Application: HTTP + Kafka + gRPC
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
      },
      consumer: {
        groupId: 'user-service-consumer',
      },
    },
  });

  const { USER_PROTO_PATH } = await import('@app/common');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: USER_PROTO_PATH,
      url: '0.0.0.0:50051',
    },
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();
  const port = configService.get<number>('PORT', 3003);
  await app.listen(port);
  console.log(`🚀 User Service running on http://localhost:${port}/api/v1/users`);
}
bootstrap();
