// services/market/utils/retry.js
// ── RETRY UTILITY WITH EXPONENTIAL BACKOFF + RATE LIMIT DETECTION ──

const { RETRY_CONFIG } = require('../constants');

// Track rate limits per provider
const rateLimitMap = new Map();

/**
 * Check if error is a rate limit (HTTP 429 or provider-specific message)
 */
function isRateLimited(error) {
  const msg = error.message.toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('throttled') ||
    msg.includes('api limit exceeded') ||
    msg.includes('request limit')
  );
}

/**
 * Get the retry-after delay for a provider
 */
function getRetryAfter(error, provider) {
  const match = error.message.match(/retry[_-]?after[=:]\s*(\d+)/i);
  if (match) return parseInt(match[1]) * 1000;
  
  const defaults = {
    coingecko: 65000,
    binance:   1000,
    kraken:    5000,
    kucoin:    3000,
  };
  
  return defaults[provider] || 5000;
}

/**
 * Record a rate limit event for a provider
 */
function recordRateLimit(provider, retryAfterMs) {
  rateLimitMap.set(provider, {
    provider,
    retryAfter: Math.ceil(retryAfterMs / 1000),
    detectedAt: Date.now(),
  });
}

/**
 * Check if a provider is currently rate-limited
 */
function isProviderRateLimited(provider) {
  const info = rateLimitMap.get(provider);
  if (!info) return false;
  
  const elapsed = (Date.now() - info.detectedAt) / 1000;
  if (elapsed >= info.retryAfter) {
    rateLimitMap.delete(provider);
    return false;
  }
  return true;
}

/**
 * Get remaining cooldown for a provider in ms
 */
function getRateLimitCooldown(provider) {
  const info = rateLimitMap.get(provider);
  if (!info) return 0;
  
  return Math.max(0, (info.detectedAt + info.retryAfter * 1000) - Date.now());
}

/**
 * Execute a function with retry logic and exponential backoff.
 */
async function withRetry(fn, provider, options = {}) {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    initialDelay = RETRY_CONFIG.INITIAL_DELAY,
    maxDelay = RETRY_CONFIG.MAX_DELAY,
    backoffMultiplier = RETRY_CONFIG.BACKOFF_MULTIPLIER,
    retryableStatuses = RETRY_CONFIG.RETRYABLE_STATUSES,
    onRetry,
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if provider is rate-limited before attempting
      if (isProviderRateLimited(provider)) {
        const cooldown = getRateLimitCooldown(provider);
        throw new Error(`${provider} is rate-limited. Retry in ${Math.ceil(cooldown / 1000)}s`);
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        throw lastError;
      }
      
      // Check if it's a rate limit error
      if (isRateLimited(lastError)) {
        const retryAfterMs = getRetryAfter(lastError, provider);
        recordRateLimit(provider, retryAfterMs);
        
        const delay = Math.min(retryAfterMs, maxDelay);
        console.warn(`[Retry] ${provider} rate-limited. Backing off ${Math.ceil(delay / 1000)}s (attempt ${attempt + 1}/${maxRetries})`);
        
        if (onRetry) onRetry(attempt + 1, lastError, delay);
        await sleep(delay);
        continue;
      }
      
      // Check if status code indicates retryable error
      const isRetryableStatus = retryableStatuses.some(
        status => lastError.message.includes(String(status))
      );
      
      if (isRetryableStatus) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );
        console.warn(`[Retry] ${provider} failed: ${lastError.message}. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        if (onRetry) onRetry(attempt + 1, lastError, delay);
        await sleep(delay);
        continue;
      }
      
      // Non-retryable error — throw immediately
      throw lastError;
    }
  }
  
  throw lastError || new Error('Retry exhausted with no error');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  isRateLimited,
  getRetryAfter,
  recordRateLimit,
  isProviderRateLimited,
  getRateLimitCooldown,
  withRetry,
};