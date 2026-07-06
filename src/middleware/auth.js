'use strict';

const config  = require('../config');
const respond = require('../utils/respond');

const ADMIN_TOKEN = config.auth?.adminToken;

/**
 * Require `Authorization: Bearer <adminToken>` header.
 * Used on internal ingestion / admin routes only.
 */
module.exports = function adminAuth(req, res, next) {
  if (!ADMIN_TOKEN) {
    return respond.unauthorized(res, 'Admin token not configured on server');
  }

  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || token !== ADMIN_TOKEN) {
    return respond.unauthorized(res, 'Valid admin token required');
  }

  next();
};
