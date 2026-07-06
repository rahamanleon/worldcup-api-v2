'use strict';

const { validationResult } = require('express-validator');
const respond = require('../utils/respond');

/**
 * Run after express-validator chains.
 * Returns 400 with field-level error details if validation failed.
 */
module.exports = function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return respond.badRequest(res, 'Validation failed', errors.array());
  }
  next();
};
