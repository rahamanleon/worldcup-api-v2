'use strict';

const searchService = require('../services/searchService');
const respond       = require('../utils/respond');

async function search(req, res) {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return respond.badRequest(res, 'Query must be at least 2 characters');

  const results = await searchService.search(q);
  return respond.ok(res, results);
}

module.exports = { search };
