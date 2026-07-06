'use strict';

const { query, param } = require('express-validator');

const listTeamsRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isIn(['name', 'code', 'confederation', 'created_at']),
  query('order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
];

const getTeamRules = [
  param('id').isUUID().withMessage('Team ID must be a valid UUID'),
];

module.exports = { listTeamsRules, getTeamRules };
