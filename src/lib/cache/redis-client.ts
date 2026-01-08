/**
 * Redis Client for Query Caching - FEAT-006
 *
 * Uses Upstash Redis for serverless-compatible caching.
 * Gracefully degrades if Redis is not configured.
 */

import { Redis } from "@upstash/redis";

// Singleton Redis client
let redisClient: Redis | null = null;
let initializationAttempted = false;

/**
 * Get the Redis client instance.
 * Returns null if Redis is not configured or initialization fails.
 */
export function getRedisClient(): Redis | null {
  if (initializationAttempted) {
    return redisClient;
  }

  initializationAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.log("[Cache] Redis not configured - caching disabled");
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });
    console.log("[Cache] Redis client initialized successfully");
    return redisClient;
  } catch (error) {
    console.error("[Cache] Failed to initialize Redis client:", error);
    return null;
  }
}

/**
 * Check if caching is available
 */
export function isCacheAvailable(): boolean {
  return getRedisClient() !== null;
}

/**
 * Test Redis connection
 */
export async function testConnection(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch (error) {
    console.error("[Cache] Redis connection test failed:", error);
    return false;
  }
}

export default getRedisClient;
