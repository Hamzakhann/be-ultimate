import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module.js';
import { UserProfile } from './users/entities/user-profile.entity.js';
import { join } from 'path';
import { DiscoveryModule } from '@app/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { RedisCustomModule } from './database/redis.module.js';
import { CacheModule } from './common/cache/cache.module.js';

@Module({
  imports: [
    DiscoveryModule,
    TerminusModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), 'apps/user-service/.env'),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('USER_DB_HOST', 'localhost'),
        port: config.get<number>('USER_DB_PORT', 5432),
        username: config.get<string>('USER_DB_USERNAME', 'admin'),
        password: String(config.get<string>('USER_DB_PASSWORD', 'password123')),
        database: config.get<string>('USER_DB_NAME', 'fintech_user_profile'),
        entities: [UserProfile],
        synchronize: true, // Auto-sync in dev to apply new UserProfile fields
        // migrations: ['dist/apps/user-service/src/database/migrations/*.js'],
        // migrationsRun: false,
      }),
    }),

    // Redis connection (global — available everywhere in this service)
    RedisCustomModule,
    // Cache-Aside abstraction on top of Redis (global)
    CacheModule,

    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
