import 'server-only';
import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

// Lightweight in-memory fallback for local development when live Redis is not yet configured.
class LocalDevInMemoryRedis {
  private store = new Map<string, { value: any; expiresAt?: number }>();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: any, opts?: { ex?: number; nx?: boolean }): Promise<'OK' | null> {
    if (opts?.nx && this.store.has(key)) {
      const existing = this.store.get(key);
      if (!existing?.expiresAt || Date.now() <= existing.expiresAt) {
        return null;
      }
    }
    const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

let devFallbackStore: LocalDevInMemoryRedis | null = null;

export function getRedis(): Redis {
  if (redisClient) return redisClient;

  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === 'development' || !process.env.VERCEL) {
      console.warn(
        '[redis] No KV_REST_API_URL or UPSTASH_REDIS_REST_URL found. Using in-memory store for local development.',
      );
      if (!devFallbackStore) devFallbackStore = new LocalDevInMemoryRedis();
      return devFallbackStore as unknown as Redis;
    }
    throw new Error('Redis is not configured: set KV_REST_API_URL and KV_REST_API_TOKEN.');
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedis();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});
