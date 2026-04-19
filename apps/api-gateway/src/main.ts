import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { HttpRpcExceptionFilter } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  
  app.setGlobalPrefix('api/v1');
  app.enableCors(); // Crucial for future React app
  app.useGlobalFilters(new HttpRpcExceptionFilter());
  
  await app.listen(3000);
  console.log('🚀 API Gateway is live on http://localhost:3000/api/v1');
}
bootstrap();
