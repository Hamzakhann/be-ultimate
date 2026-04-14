import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { User } from './auth/entities/user.entity.js';
import { Wallet } from './auth/entities/wallet.entity.js';

@Module({
  imports: [
    // Load .env from the auth-service directory
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM connected to the dedicated auth DB (AUTH_DB_* vars)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('AUTH_DB_HOST', 'localhost'),
        port: config.get<number>('AUTH_DB_PORT', 5432),
        username: config.get<string>('AUTH_DB_USER', 'postgres'),
        password: config.get<string>('AUTH_DB_PASS', ''),
        database: config.get<string>('AUTH_DB_NAME', 'fintech_auth'),
        entities: [User, Wallet],
        synchronize: process.env.NODE_ENV !== 'production', // Auto-sync only in dev
        logging: process.env.NODE_ENV === 'development',
      }),
    }),

    AuthModule,
  ],
})
export class AppModule { }
