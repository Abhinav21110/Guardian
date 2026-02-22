/**
 * Cache Service
 * Redis-based caching for scan results and threat intel
 */

import { createClient, RedisClientType } from 'redis';

export class CacheService {
  private client: RedisClientType | null = null;
  private defaultTTL = 3600; // 1 hour

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('Max retries reached');
          return Math.min(retries * 100, 3000);
        }
      }
    });

    this.client.on('error', (err) => console.error('Redis Client Error:', err));
    this.client.on('connect', () => console.log('✅ Redis connected'));

    await this.client.connect();
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) throw new Error('Cache not connected');

    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) throw new Error('Cache not connected');

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl || this.defaultTTL, serialized);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    if (!this.client) throw new Error('Cache not connected');

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Generate cache key for URL scan
   */
  urlScanKey(url: string): string {
    return `scan:url:${Buffer.from(url).toString('base64')}`;
  }

  /**
   * Generate cache key for threat intel
   */
  threatIntelKey(url: string): string {
    return `threat:${Buffer.from(url).toString('base64')}`;
  }

  /**
   * Store rate limit counter
   */
  async incrementRateLimit(identifier: string, windowSeconds: number = 60): Promise<number> {
    if (!this.client) throw new Error('Cache not connected');

    const key = `ratelimit:${identifier}`;
    
    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, windowSeconds);
      }
      return count;
    } catch (error) {
      console.error('Rate limit error:', error);
      return 0;
    }
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<void> {
    if (!this.client) throw new Error('Cache not connected');
    await this.client.flushAll();
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      console.log('✅ Redis disconnected');
    }
  }
}
