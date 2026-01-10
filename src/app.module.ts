import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisCustomModule } from './database/redis.module';
import { CacheModule } from './common/cache/cache.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        replication: {
          master: {
            host: config.get<string>('DB_HOST'),
            port: config.get<number>('DB_PORT'),
            username: config.get<string>('DB_USERNAME'),
            password: config.get<string>('DB_PASSWORD'),
            database: config.get<string>('DB_NAME'),
          },
          slaves: [{
            host: config.get<string>('DB_REPLICA_HOST'),
            port: config.get<number>('DB_REPLICA_PORT'),
            username: config.get<string>('DB_USERNAME'),
            password: config.get<string>('DB_PASSWORD'),
            database: config.get<string>('DB_NAME'),
          }],
        },
        autoLoadEntities: true,
        synchronize: false, // Only for development
        logging: ['query', 'error'], // Great for seeing which DB is hit
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
        // These options are sometimes required for strict auth handshakes
        authSource: 'admin',
        user: 'admin',
        pass: 'password123',
      }),
    }),
    RedisCustomModule,
    CacheModule,
    UsersModule,
    AuthModule,
    AuditModule
  ],
})
export class AppModule { }