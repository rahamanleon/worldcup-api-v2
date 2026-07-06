'use strict';

const matchRepo = require('../repositories/matchRepository');
const cache     = require('../utils/cache');
const config    = require('../config');

const MATCH_TTL = config.cache.matchTtlSeconds;

async function listMatches({ page, limit, offset, tournamentYear, stage, status, sort, order }) {
  const cacheKey = `matches:list:${page}:${limit}:${tournamentYear}:${stage}:${status}:${sort}:${order}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await matchRepo.findAll({ limit, offset, tournamentYear, stage, status, sort, order });
  cache.set(cacheKey, result, MATCH_TTL);
  return result;
}

async function getMatch(id) {
  const cacheKey = `match:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const match = await matchRepo.findById(id);
  if (match) cache.set(cacheKey, match, MATCH_TTL);
  return match;
}

async function getLiveMatches() {
  // Live cache is managed by liveIngestionService; fall back to DB query
  const live = await matchRepo.findLive();
  return live;
}

module.exports = { listMatches, getMatch, getLiveMatches };
