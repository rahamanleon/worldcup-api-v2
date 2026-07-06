'use strict';

const tournamentService = require('../services/tournamentService');
const respond           = require('../utils/respond');

async function listTournaments(req, res) {
  const rows = await tournamentService.listTournaments();
  return respond.ok(res, rows);
}

async function getTournament(req, res) {
  const { year } = req.params;
  const tournament = await tournamentService.getTournament(year);
  if (!tournament) return respond.notFound(res, `Tournament ${year} not found`);
  return respond.ok(res, tournament);
}

module.exports = { listTournaments, getTournament };
