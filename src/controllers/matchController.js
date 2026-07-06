'use strict';

const matchService            = require('../services/matchService');
const liveService             = require('../services/liveIngestionService');
const respond                 = require('../utils/respond');
const { parsePagination }     = require('../utils/pagination');

async function listMatches(req, res) {
  const { page, limit, offset } = parsePagination(req.query);
  const { tournament, stage, status, sort, order } = req.query;

  const { rows, total } = await matchService.listMatches({
    page, limit, offset,
    tournamentYear: tournament,
    stage,
    status,
    sort:  sort  || 'match_date',
    order: order || 'ASC',
  });

  return respond.paginated(res, rows, { page, limit, total });
}

async function getMatch(req, res) {
  const match = await matchService.getMatch(req.params.id);
  if (!match) return respond.notFound(res, 'Match not found');
  return respond.ok(res, match);
}

async function getLive(req, res) {
  // Prefer cache; fall back to a direct DB query for status=live
  const cached = liveService.getCachedLiveMatches();
  if (cached && cached.length > 0) {
    return respond.ok(res, cached, { cached: true });
  }

  const live = await matchService.getLiveMatches();
  return respond.ok(res, live, { cached: false });
}

module.exports = { listMatches, getMatch, getLive };
