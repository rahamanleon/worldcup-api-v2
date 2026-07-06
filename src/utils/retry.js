'use strict';

const logger = require('./logger');

/**
 * Retry an async fn up to maxRetries times with exponential backoff.
 *
 * @param {Function} fn           - Async function that may throw
 * @param {object}   opts
 * @param {number}   opts.maxRetries   - How many attempts (default 3)
 * @param {number}   opts.baseMs       - Base delay in ms (default 1000)
 * @param {string}   opts.label        - Log label
 * @returns {Promise<any>}
 */
async function withRetry(fn, { maxRetries = 3, baseMs = 1000, label = 'retry' } = {}) {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;

      const delay = baseMs * Math.pow(2, attempt - 1);
      logger.warn(`${label} failed, retrying`, { attempt, delay, error: err.message });
      await sleep(delay);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { withRetry, sleep };
