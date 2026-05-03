// src/services/market/providers/base.provider.js
// ── ABSTRACT BASE PROVIDER (UPDATED) ──

const { withRetry } = require('../utils/retry');

class BaseProvider {
  constructor() {
    this.errorCount = 0;
    this.lastError = null;
    this.startTime = Date.now();
  }

  get name() {
    throw new Error('Provider must define `name`');
  }

  get config() {
    throw new Error('Provider must define `config`');
  }

  async fetchPrice(symbol) {
    throw new Error('Not implemented');
  }

  async fetchCandles(symbol, interval, limit) {
    throw new Error('Not implemented');
  }

  // ⚠️ Default: return empty (not all providers have market lists)
  async fetchMarkets() {
    return [];
  }

  async getPrice(symbol) {
    this.startTime = Date.now();
    try {
      return await withRetry(
        () => this.fetchPrice(symbol),
        this.name,
        { onRetry: (a, e, d) => this.onRetry(a, e, d) }
      );
    } catch (error) {
      this.recordError(error);
      throw error;
    }
  }

  async getCandles(symbol, interval, limit = 500) {
    this.startTime = Date.now();
    try {
      return await withRetry(
        () => this.fetchCandles(symbol, interval, limit),
        this.name,
        { onRetry: (a, e, d) => this.onRetry(a, e, d) }
      );
    } catch (error) {
      this.recordError(error);
      throw error;
    }
  }

  async getMarkets() {
    this.startTime = Date.now();
    try {
      return await withRetry(
        () => this.fetchMarkets(),
        this.name,
        { onRetry: (a, e, d) => this.onRetry(a, e, d) }
      );
    } catch (error) {
      this.recordError(error);
      throw error;
    }
  }

  async healthCheck() {
    throw new Error('Not implemented');
  }

  getHealth() {
    return {
      name: this.name,
      healthy: this.errorCount < 3,
      lastCheck: Date.now(),
      lastError: this.lastError,
      latency: Date.now() - this.startTime,
    };
  }

  onRetry(attempt, error, delay) {
    console.warn(`[${this.name}] Retry #${attempt} after ${delay}ms: ${error.message}`);
  }

  recordError(error) {
    this.errorCount++;
    this.lastError = error.message;
    console.error(`[${this.name}] Error: ${error.message}`);
  }

  safeNumber(val) {
    const n = parseFloat(String(val));
    return isNaN(n) ? 0 : n;
  }

  timeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${this.name} timeout after ${ms}ms`)), ms)
      ),
    ]);
  }
}

module.exports = { BaseProvider };