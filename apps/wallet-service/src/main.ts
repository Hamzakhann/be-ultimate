import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set Global Prefix
  app.setGlobalPrefix('api');
  
  // Enable Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Kafka Microservice Setup
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId: 'wallet-consumer-group',
      },
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3002,
    },
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Wallet Service')
    .setDescription('Financial Core API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start HTTP and Microservices
  await app.startAllMicroservices();
  const port = (process.env.PORT ? parseInt(process.env.PORT as string) : 3002) + 100;
  await app.listen(port);
  console.log(`🚀 Wallet Service HTTP running on: http://localhost:${port}/api`);
  console.log(`📡 Wallet Service TCP Microservice running on port 3002`);
}
bootstrap();
