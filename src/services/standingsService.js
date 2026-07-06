'use strict';

const standingsRepo = require('../repositories/standingsRepository');
const cache         = require('../utils/cache');
const config        = require('../config');

const STANDINGS_TTL = config.cache.standingsTtlSeconds;

async function getStandings(year) {
  const cacheKey = `standings:${year}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rows = await standingsRepo.findByYear(year);
  if (rows.length) cache.set(cacheKey, rows, STANDINGS_TTL);
  return rows;
}

async function getGroup(year, groupName) {
  const cacheKey = `group:${year}:${groupName}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const rows = await standingsRepo.findByYearAndGroup(year, groupName);
  if (rows.length) cache.set(cacheKey, rows, STANDINGS_TTL);
  return rows;
}

module.exports = { getStandings, getGroup };
