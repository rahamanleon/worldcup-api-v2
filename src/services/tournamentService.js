'use strict';

const tournamentRepo = require('../repositories/tournamentRepository');
const cache          = require('../utils/cache');

const TTL = 3600; // tournaments rarely change

async function listTournaments() {
  const cached = cache.get('tournaments:all');
  if (cached) return cached;

  const rows = await tournamentRepo.findAll();
  cache.set('tournaments:all', rows, TTL);
  return rows;
}

async function getTournament(year) {
  const cacheKey = `tournament:${year}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const row = await tournamentRepo.findByYear(year);
  if (row) cache.set(cacheKey, row, TTL);
  return row;
}

module.exports = { listTournaments, getTournament };
