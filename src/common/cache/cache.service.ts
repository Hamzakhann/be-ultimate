import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
    constructor(@InjectRedis() private readonly redis: Redis) {}

    /**
     * Cache-Aside Pattern with Stampede Protection
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttlInSeconds: number = 3600,
    ): Promise<T> {
        // 1. Try to get from Redis
        const cachedValue = await this.redis.get(key);
        if (cachedValue) {
            return JSON.parse(cachedValue);
        }

        // 2. Simple Stampede Protection: Use a temporary lock
        const lockKey = `${key}:lock`;
        const locked = await this.redis.set(lockKey, 'locked', 'EX', 5, 'NX');

        if (!locked) {
            // If locked, wait a bit and try getting again (someone else is fetching)
            await new Promise((resolve) => setTimeout(resolve, 200));
            return this.getOrSet(key, fetchFn, ttlInSeconds);
        }

        // 3. Cache Miss - Fetch from Database
        const freshData = await fetchFn();

        // 4. Set to Redis with TTL
        await this.redis.set(key, JSON.stringify(freshData), 'EX', ttlInSeconds);

        // Release lock
        await this.redis.del(lockKey);

        return freshData;
    }

    async invalidate(key: string) {
        await this.redis.del(key);
    }
}