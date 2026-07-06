'use strict';

const teamService             = require('../services/teamService');
const respond                 = require('../utils/respond');
const { parsePagination }     = require('../utils/pagination');

async function listTeams(req, res) {
  const { page, limit, offset } = parsePagination(req.query);
  const sort  = req.query.sort  || 'name';
  const order = req.query.order || 'ASC';

  const { rows, total } = await teamService.listTeams({ page, limit, offset, sort, order });
  return respond.paginated(res, rows, { page, limit, total });
}

async function getTeam(req, res) {
  const team = await teamService.getTeam(req.params.id);
  if (!team) return respond.notFound(res, 'Team not found');
  return respond.ok(res, team);
}

module.exports = { listTeams, getTeam };
