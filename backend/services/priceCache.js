// services/priceCache.js
// ── IN-MEMORY CACHE (L1) ──
// TODO: Redis for multi-instance

const store = new Map();   // key → { value, source, ts }

exports.get = (key, ttlMs) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry;
};

exports.set = (key, value, source) => {
  store.set(key, { value, source, ts: Date.now() });
};

exports.clear = () => store.clear();