'use strict';

/**
 * Simple in-memory TTL cache.
 * Interface mirrors a KV store so it can be swapped for Redis/Cloudflare KV later.
 *
 * Usage:
 *   cache.set('key', value, ttlSeconds)
 *   cache.get('key')          → value | null
 *   cache.del('key')
 *   cache.flush()
 */

const store = new Map(); // key → { value, expiresAt }

function set(key, value, ttlSeconds) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function del(key) {
  store.delete(key);
}

function flush() {
  store.clear();
}

// Periodic cleanup to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) store.delete(key);
  }
}, 60_000);

module.exports = { set, get, del, flush };
