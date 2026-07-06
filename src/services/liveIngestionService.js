'use strict';

const config          = require('../config');
const logger          = require('../utils/logger');
const cache           = require('../utils/cache');
const { withRetry }   = require('../utils/retry');
const { getProvider } = require('../providers');
const matchRepo       = require('../repositories/matchRepository');
const teamRepo        = require('../repositories/teamRepository');

const LIVE_CACHE_KEY = 'live:matches';
const LIVE_TTL       = config.cache.liveTtlSeconds;
const POLL_INTERVAL  = (config.live.pollIntervalSeconds || 30) * 1000;
const MAX_RETRIES    = config.live.maxRetries || 3;
const BACKOFF_BASE   = config.live.backoffBaseMs || 1000;

let _provider  = null;
let _pollTimer = null;

function getOrInitProvider() {
  if (!_provider) _provider = getProvider();
  return _provider;
}

/**
 * Fetch live matches from the provider, update DB, refresh cache.
 * On failure: log the error and serve stale cached data.
 */
async function ingestLiveMatches() {
  const provider = getOrInitProvider();

  let liveMatches;
  try {
    liveMatches = await withRetry(
      () => provider.fetchLiveMatches(),
      { maxRetries: MAX_RETRIES, baseMs: BACKOFF_BASE, label: 'liveIngestion' }
    );
  } catch (err) {
    logger.error('Live ingestion failed after retries — serving stale cache', { error: err.message });
    return; // stale cache will continue to be served
  }

  if (!Array.isArray(liveMatches) || liveMatches.length === 0) {
    logger.debug('No live matches returned by provider');
    cache.set(LIVE_CACHE_KEY, [], LIVE_TTL);
    return;
  }

  const updated = [];

  for (const lm of liveMatches) {
    try {
      const sanitized = sanitizeLiveMatch(lm);
      if (!sanitized) continue;

      // Resolve team IDs from codes
      const homeTeam = await teamRepo.findByCode(sanitized.homeTeamCode);
      const awayTeam = await teamRepo.findByCode(sanitized.awayTeamCode);

      if (!homeTeam || !awayTeam) {
        logger.warn('Unknown team codes in live match', {
          home: sanitized.homeTeamCode,
          away: sanitized.awayTeamCode,
        });
        continue;
      }

      // Try to find existing match by external_id and update live fields only
      const existing = await matchRepo.findByExternalId(sanitized.externalId);

      if (existing) {
        const patched = await matchRepo.updateLiveFields(existing.id, {
          home_score: sanitized.homeScore,
          away_score: sanitized.awayScore,
          status:     sanitized.status,
          minute:     sanitized.minute,
        });
        if (patched) updated.push(patched);
      } else {
        logger.debug('Live match not in DB yet — skipping update', { externalId: sanitized.externalId });
      }
    } catch (innerErr) {
      logger.error('Error processing live match', { error: innerErr.message });
    }
  }

  cache.set(LIVE_CACHE_KEY, updated.length > 0 ? updated : liveMatches, LIVE_TTL);
  logger.info('Live ingestion complete', { updated: updated.length });
}

function sanitizeLiveMatch(lm) {
  if (!lm || typeof lm !== 'object') return null;
  return {
    externalId:   String(lm.externalId || ''),
    homeTeamCode: String(lm.homeTeamCode || '').toUpperCase(),
    awayTeamCode: String(lm.awayTeamCode || '').toUpperCase(),
    homeScore:    lm.homeScore !== undefined ? Number(lm.homeScore) : null,
    awayScore:    lm.awayScore !== undefined ? Number(lm.awayScore) : null,
    status:       ['scheduled', 'live', 'finished', 'postponed', 'canceled'].includes(lm.status)
                    ? lm.status : 'scheduled',
    minute:       lm.minute != null ? Number(lm.minute) : null,
  };
}

/** Return cached live matches (may be stale if provider is down). */
function getCachedLiveMatches() {
  return cache.get(LIVE_CACHE_KEY) || [];
}

/** Start the polling loop. Safe to call multiple times — won't double-start. */
function startPolling() {
  if (!config.live.enabled) {
    logger.info('Live polling disabled in config');
    return;
  }
  if (_pollTimer) return;

  // Run immediately, then on interval
  ingestLiveMatches();
  _pollTimer = setInterval(ingestLiveMatches, POLL_INTERVAL);
  logger.info('Live polling started', { intervalMs: POLL_INTERVAL });
}

function stopPolling() {
  if (_pollTimer) {
    clearInterval(_pollTimer);
    _pollTimer = null;
  }
}

module.exports = { startPolling, stopPolling, ingestLiveMatches, getCachedLiveMatches };
