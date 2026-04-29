import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryService } from './discovery.service.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
