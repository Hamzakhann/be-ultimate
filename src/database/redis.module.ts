import { Global, Module } from '@nestjs/common';
import { RedisModule as IoRedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [
        IoRedisModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'single',
                url: `redis://${config.get('REDIS_HOST')}:${config.get('REDIS_PORT')}`,
            }),
        }),
    ],
    exports: [IoRedisModule],
})
export class RedisCustomModule { }