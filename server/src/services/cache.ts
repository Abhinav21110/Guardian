// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Redis Cache Service
// Falls back gracefully to in-memory when Redis is unavailable
// ─────────────────────────────────────────────────────────────────────────────
import { createClient, type RedisClientType } from 'redis';
import { config } from '../config/env';
import { logger } from '../config/logger';

let _client: RedisClientType | null = null;
let _connected = false;

// In-memory fallback
const memCache = new Map<string, { value: string; expiresAt: number }>();

async function getRedis(): Promise<RedisClientType | null> {
  if (_client && _connected) return _client;
  if (_client && !_connected) return null;

  try {
    const client = createClient({ url: config.redis.url }) as RedisClientType;
    client.on('error', (err: unknown) => {
      logger.warn({ err }, 'Redis connection error – using in-memory fallback');
      _connected = false;
    });
    client.on('connect', () => {
      _connected = true;
      logger.info('Redis connected');
    });
    await client.connect();
    _client = client;
    return client;
  } catch (err) {
    logger.warn({ err }, 'Redis unavailable – using in-memory cache');
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedis();
    if (redis && _connected) {
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
  } catch { /* fall through to mem */ }

  // Memory fallback
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memCache.delete(key); return null; }
  return JSON.parse(entry.value) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = config.redis.ttl): Promise<void> {
  const serialised = JSON.stringify(value);
  try {
    const redis = await getRedis();
    if (redis && _connected) {
      await redis.setEx(key, ttlSeconds, serialised);
      return;
    }
  } catch { /* fall through */ }

  // Memory fallback
  memCache.set(key, { value: serialised, expiresAt: Date.now() + ttlSeconds * 1000 });
  // Cleanup old entries if cache grows too large
  if (memCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of memCache.entries()) {
      if (now > v.expiresAt) memCache.delete(k);
    }
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = await getRedis();
    if (redis && _connected) { await redis.del(key); return; }
  } catch { /* fall through */ }
  memCache.delete(key);
}

export function buildScanCacheKey(url: string): string {
  // Normalise before hashing
  const norm = url.trim().toLowerCase();
  const hashHex = Buffer.from(norm).toString('base64url').slice(0, 32);
  return `guardian:scan:${hashHex}`;
}

export async function disconnectRedis(): Promise<void> {
  if (_client && _connected) {
    await _client.disconnect();
    _connected = false;
    _client = null;
  }
}
