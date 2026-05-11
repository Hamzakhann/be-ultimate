import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { HttpRpcExceptionFilter, createGlobalLogger } from '@app/common';

async function bootstrap() {
  // Explicitly supply our dynamic shared Winston Logger
  const app = await NestFactory.create(ApiGatewayModule, {
    logger: createGlobalLogger('api-gateway'),
  });
  
  app.setGlobalPrefix('api/v1');
  app.enableCors(); // Crucial for future React app
  app.useGlobalFilters(new HttpRpcExceptionFilter());
  
  await app.listen(3000);
  console.log('🚀 API Gateway is live on http://localhost:3000/api/v1');
}
bootstrap();
