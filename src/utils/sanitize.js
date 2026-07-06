'use strict';

/**
 * Keep only the listed keys from an object.
 * Prevents unexpected fields from external providers reaching the DB.
 */
function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return {};
  return keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

/**
 * Coerce a value to string, truncated to maxLen, or return null.
 */
function safeString(val, maxLen = 255) {
  if (val === null || val === undefined) return null;
  return String(val).slice(0, maxLen);
}

/**
 * Coerce a value to an integer or return null.
 */
function safeInt(val) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Validate an ISO date string; return null if invalid.
 */
function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

module.exports = { pick, safeString, safeInt, safeDate };
