'use strict';

const standingsService = require('../services/standingsService');
const respond          = require('../utils/respond');

async function getStandings(req, res) {
  const { year } = req.params;
  const rows = await standingsService.getStandings(year);
  if (!rows.length) return respond.notFound(res, `No standings found for ${year}`);
  return respond.ok(res, rows);
}

async function getGroup(req, res) {
  const { year, group } = req.params;
  const rows = await standingsService.getGroup(year, group);
  if (!rows.length) return respond.notFound(res, `Group ${group} not found for ${year}`);
  return respond.ok(res, rows);
}

module.exports = { getStandings, getGroup };
