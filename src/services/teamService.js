'use strict';

const teamRepo = require('../repositories/teamRepository');
const cache    = require('../utils/cache');
const config   = require('../config');

const TEAM_TTL = config.cache.teamTtlSeconds;

async function listTeams({ page, limit, offset, sort, order }) {
  const cacheKey = `teams:list:${page}:${limit}:${sort}:${order}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const result = await teamRepo.findAll({ limit, offset, sort, order });
  cache.set(cacheKey, result, TEAM_TTL);
  return result;
}

async function getTeam(id) {
  const cacheKey = `team:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const team = await teamRepo.findById(id);
  if (team) cache.set(cacheKey, team, TEAM_TTL);
  return team;
}

module.exports = { listTeams, getTeam };
