import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule, DiscoveryService } from '@app/common';
import { TerminusModule } from '@nestjs/terminus';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HealthController } from './health.controller.js';
import { NotificationServiceController } from './notification-service.controller.js';
import { NotificationServiceService } from './notification-service.service.js';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), 'apps/notification-service/.env'),
    }),
    DiscoveryModule,
    TerminusModule,
    ClientsModule.registerAsync([
      {
        name: 'USER_PACKAGE',
        imports: [DiscoveryModule],
        inject: [DiscoveryService],
        useFactory: async (discoveryService: DiscoveryService) => {
          const { USER_PROTO_PATH } = await import('@app/common');
          try {
            const { address, port } = await discoveryService.discoverService('user-service-grpc');
            return {
              transport: Transport.GRPC,
              options: {
                package: 'user',
                protoPath: USER_PROTO_PATH,
                url: `${address}:${port}`,
              },
            };
          } catch (error) {
            return {
              transport: Transport.GRPC,
              options: {
                package: 'user',
                protoPath: USER_PROTO_PATH,
                url: 'localhost:50051', // Fallback
              },
            };
          }
        },
      },
    ]),
  ],
  controllers: [HealthController, NotificationServiceController],
  providers: [NotificationServiceService],
})
export class NotificationServiceModule {}
