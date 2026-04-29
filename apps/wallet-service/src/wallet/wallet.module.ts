import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { WalletService } from './wallet.service.js';
import { WalletController } from './wallet.controller.js';
import { WalletConsumer } from './wallet.consumer.js';
import { Wallet } from './entities/wallet.entity.js';
import { Transaction } from './entities/transaction.entity.js';
import { CommandHandlers } from './commands/index.js';
import { EventHandlers } from './events/index.js';
import { QueryHandlers } from './queries/index.js';
import { DiscoveryModule, DiscoveryService } from '@app/common';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Wallet, Transaction]),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: config.get<string>('KAFKA_CLIENT_ID', 'wallet-service'),
              brokers: [config.get<string>('KAFKA_BROKER', 'localhost:9092')],
            },
            consumer: {
              groupId: config.get<string>('KAFKA_GROUP_ID', 'wallet-group'),
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'USER_PACKAGE',
        imports: [DiscoveryModule],
        inject: [DiscoveryService],
        useFactory: async (discoveryService: DiscoveryService) => {
          try {
            const { USER_PROTO_PATH } = await import('@app/common');
            const { address, port } = await discoveryService.discoverService('user-service-grpc');
            console.log(`[WalletModule] Resolved user-service-grpc at ${address}:${port}`);
            return {
              transport: Transport.GRPC,
              options: {
                package: 'user',
                protoPath: USER_PROTO_PATH,
                url: `${address}:${port}`,
              },
            };
          } catch (error) {
            console.error('[WalletModule] gRPC Discovery Failed:', error.message);
            throw error;
          }
        },
      },
    ]),
  ],
  controllers: [WalletController, WalletConsumer],
  providers: [WalletService, ...CommandHandlers, ...EventHandlers, ...QueryHandlers],
  exports: [WalletService],
})
export class WalletModule {}
