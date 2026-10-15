import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis max retries reached');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis error');
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting');
    });
  }

  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  if (client.status === 'wait') {
    await client.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected gracefully');
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = env.REDIS_TTL_DEFAULT
): Promise<void> {
  const client = getRedisClient();
  await client.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

export async function deleteCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const client = getRedisClient();
  await client.del(...keys);
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  let cursor = '0';
  do {
    const [newCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = newCursor;
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } while (cursor !== '0');
}

export async function mgetCache<T>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];
  const client = getRedisClient();
  const values = await client.mget(...keys);
  return values.map((v) => (v ? JSON.parse(v) : null));
}

export async function msetCache<T>(
  entries: Array<{ key: string; value: T; ttl?: number }>
): Promise<void> {
  if (entries.length === 0) return;
  const client = getRedisClient();
  const pipeline = client.pipeline();
  for (const entry of entries) {
    pipeline.setex(entry.key, entry.ttl ?? env.REDIS_TTL_DEFAULT, JSON.stringify(entry.value));
  }
  await pipeline.exec();
}

export async function invalidateProductCache(productId?: string): Promise<void> {
  const keysToDelete: string[] = [];
  if (productId) {
    keysToDelete.push(`product:${productId}`, `product:detail:${productId}`);
  }
  keysToDelete.push(...(await getKeysByPattern('products:list:*')));
  keysToDelete.push(...(await getKeysByPattern('products:search:*')));
  keysToDelete.push(...(await getKeysByPattern('products:featured*')));
  if (keysToDelete.length > 0) {
    await deleteCache(...keysToDelete);
  }
}

export async function invalidateCategoryCache(): Promise<void> {
  const keys = await getKeysByPattern('categories:*');
  if (keys.length > 0) {
    await deleteCache(...keys);
  }
}

export async function invalidateSearchCache(): Promise<void> {
  const keys = await getKeysByPattern('search:*');
  if (keys.length > 0) {
    await deleteCache(...keys);
  }
}

export async function invalidateAllCaches(): Promise<void> {
  await invalidateProductCache();
  await invalidateCategoryCache();
  await invalidateSearchCache();
}

async function getKeysByPattern(pattern: string): Promise<string[]> {
  const client = getRedisClient();
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [newCursor, foundKeys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = newCursor;
    keys.push(...foundKeys);
  } while (cursor !== '0');
  return keys;
}

export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(':');
  return `${prefix}:${sortedParams || 'all'}`;
}

export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = env.REDIS_TTL_DEFAULT
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  const fresh = await fetcher();
  await setCache(key, fresh, ttlSeconds);
  return fresh;
}

export const CacheTTL = {
  PRODUCTS: env.REDIS_TTL_PRODUCTS,
  CATEGORIES: env.REDIS_TTL_CATEGORIES,
  SEARCH: 180,
  AUTOCOMPLETE: 3600,
  FEATURED: 600,
  HOMEPAGE: 300,
} as const;
