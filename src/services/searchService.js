'use strict';

const teamRepo  = require('../repositories/teamRepository');
const matchRepo = require('../repositories/matchRepository');

async function search(q) {
  const [teams, matches] = await Promise.all([
    teamRepo.search(q),
    matchRepo.search(q),
  ]);

  return { teams, matches };
}

module.exports = { search };
