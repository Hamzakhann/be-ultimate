import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletModule } from './wallet/wallet.module.js';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/wallet-service/.env',
    }),
    PassportModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('WALLET_DB_HOST'),
        port: config.get<number>('WALLET_DB_PORT'),
        username: config.get<string>('WALLET_DB_USER'),
        password: config.get<string>('WALLET_DB_PASS'),
        database: config.get<string>('WALLET_DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // For development only
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'super-secret-key'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    WalletModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
