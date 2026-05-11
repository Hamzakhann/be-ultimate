import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
    constructor(@InjectRedis() private readonly redis: Redis) {}

    /**
     * Cache-Aside Pattern with Stampede Protection.
     * Tries to return a cached value; on a miss, fetches fresh data,
     * stores it with a TTL, and uses a short-lived lock to prevent
     * duplicate fetches (cache stampede) under concurrent load.
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttlInSeconds: number = 3600,
    ): Promise<T> {
        // 1. Try to get from Redis
        const cachedValue = await this.redis.get(key);
        if (cachedValue) {
            return JSON.parse(cachedValue) as T;
        }

        // 2. Stampede Protection: acquire a short-lived lock
        const lockKey = `${key}:lock`;
        const locked = await this.redis.set(lockKey, 'locked', 'EX', 5, 'NX');

        if (!locked) {
            // Someone else is already fetching — wait and retry
            await new Promise((resolve) => setTimeout(resolve, 200));
            return this.getOrSet(key, fetchFn, ttlInSeconds);
        }

        // 3. Cache miss — fetch from the source of truth
        const freshData = await fetchFn();

        // 4. Persist to Redis and release the lock
        await this.redis.set(key, JSON.stringify(freshData), 'EX', ttlInSeconds);
        await this.redis.del(lockKey);

        return freshData;
    }

    /** Remove a single cache entry by key */
    async invalidate(key: string): Promise<void> {
        await this.redis.del(key);
    }

    /** Remove all cache entries whose keys match the given pattern (e.g. "user:*") */
    async invalidateByPattern(pattern: string): Promise<void> {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
}
