'use strict';

const logger  = require('../utils/logger');
const respond = require('../utils/respond');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, url: req.originalUrl });
  return respond.serverError(res);
};
