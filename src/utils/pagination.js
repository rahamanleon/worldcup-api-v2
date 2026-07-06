'use strict';

const config = require('../config');

const DEFAULT_LIMIT = config.pagination?.defaultLimit ?? 20;
const MAX_LIMIT     = config.pagination?.maxLimit     ?? 100;

/**
 * Extract page/limit from query string and return SQL-ready offset.
 * @param {object} query - req.query
 * @returns {{ page, limit, offset }}
 */
function parsePagination(query) {
  let page  = parseInt(query.page,  10) || 1;
  let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;

  if (page  < 1)         page  = 1;
  if (limit < 1)         limit = 1;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = { parsePagination };
