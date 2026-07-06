'use strict';

/**
 * Factory: returns middleware that sets Cache-Control max-age.
 * @param {number} seconds
 */
function cacheFor(seconds) {
  return (_req, res, next) => {
    res.set('Cache-Control', `public, max-age=${seconds}`);
    next();
  };
}

/** No caching — used for live data */
function noCache(_req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

module.exports = { cacheFor, noCache };
