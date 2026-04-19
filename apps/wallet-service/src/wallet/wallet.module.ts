import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service.js';
import { WalletController } from './wallet.controller.js';
import { WalletConsumer } from './wallet.consumer.js';
import { Wallet } from './entities/wallet.entity.js';
import { Transaction } from './entities/transaction.entity.js';

@Module({
  imports: [
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
        imports: [ConfigModule],
        useFactory: async (config: ConfigService) => {
          const { USER_PROTO_PATH } = await import('@app/common');
          return {
            transport: Transport.GRPC,
            options: {
              package: 'user',
              protoPath: USER_PROTO_PATH,
              url: config.get<string>('USER_SERVICE_GRPC_URL', 'localhost:50051'),
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [WalletController, WalletConsumer],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
