// services/market/utils/rate-limiter.js
// ── PROVIDER-AWARE RATE LIMIT TRACKER ──

const { RATE_LIMITS } = require('../constants');

/**
 * Token bucket rate limiter per provider
 */
class RateLimiter {
  constructor() {
    /**
     * @type {Map<string, { tokens: number, lastRefill: number, maxTokens: number, refillRate: number }>}
     */
    this.buckets = new Map();
  }

  /**
   * Initialize bucket for a provider
   */
  initProvider(provider) {
    const limits = RATE_LIMITS[provider.toUpperCase()];
    if (!limits) return;

    this.buckets.set(provider, {
      tokens: limits.requests,
      lastRefill: Date.now(),
      maxTokens: limits.requests,
      refillRate: limits.requests / limits.windowMs,
    });
  }

  /**
   * Try to consume a token. Returns remaining wait time in ms if rate-limited.
   */
  async waitIfNeeded(provider) {
    const limit = RATE_LIMITS[provider.toUpperCase()];
    if (!limit) return 0;

    if (!this.buckets.has(provider)) {
      this.initProvider(provider);
    }

    const bucket = this.buckets.get(provider);
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    // Refill tokens
    bucket.tokens = Math.min(
      bucket.maxTokens,
      bucket.tokens + elapsed * bucket.refillRate
    );
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return 0;
    }

    // Calculate wait time until next token
    const waitMs = Math.ceil((1 - bucket.tokens) / bucket.refillRate);
    return waitMs;
  }

  /**
   * Get current token count for a provider
   */
  getTokens(provider) {
    const bucket = this.buckets.get(provider);
    return bucket ? Math.floor(bucket.tokens) : 0;
  }
}

// Singleton
const rateLimiter = new RateLimiter();

module.exports = { rateLimiter };