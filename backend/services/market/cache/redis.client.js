// src/services/market/cache/redis.client.js
// ── REDIS CLIENT SINGLETON (Upstash or in-memory fallback) ──

let _redis = null;

/**
 * Get Redis client instance.
 * Falls back to in-memory cache if Upstash is not configured.
 */
function getRedisClient() {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Try Upstash Redis if configured
  if (url && token) {
    try {
      const { Redis } = require('@upstash/redis');
      _redis = new Redis({ url, token });
      console.log('[Redis] Connected to Upstash Redis');
      return _redis;
    } catch (err) {
      console.warn('[Redis] Upstash Redis failed to initialize, using in-memory fallback:', err.message);
    }
  }

  // In-memory fallback for development
  console.log('[Redis] Using in-memory cache fallback');
  _redis = createMemoryFallback();
  return _redis;
}

/**
 * Simple in-memory cache with TTL
 */
function createMemoryFallback() {
  const store = new Map();

  return {
    get: async (key) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expires) {
        store.delete(key);
        return null;
      }
      try {
        return JSON.parse(entry.value);
      } catch {
        return entry.value;
      }
    },
    set: async (key, value, opts = {}) => {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      store.set(key, {
        value: stringValue,
        expires: Date.now() + ((opts.ex || 60) * 1000),
      });
      return 'OK';
    },
    del: async (...keys) => {
      for (const key of keys) {
        store.delete(key);
      }
      return keys.length;
    },
    ping: async () => 'PONG',
  };
}

module.exports = { getRedisClient };