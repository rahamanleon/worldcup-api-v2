'use strict';

const { query, param } = require('express-validator');

const VALID_STATUSES = ['scheduled', 'live', 'finished', 'postponed', 'canceled'];
const VALID_STAGES   = ['group', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'];

const listMatchesRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('tournament').optional().isInt({ min: 1930, max: 2100 }).toInt(),
  query('stage').optional().isIn(VALID_STAGES),
  query('status').optional().isIn(VALID_STATUSES),
  query('sort').optional().isIn(['match_date', 'home_score', 'away_score', 'stage']),
  query('order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
];

const getMatchRules = [
  param('id').isUUID().withMessage('Match ID must be a valid UUID'),
];

module.exports = { listMatchesRules, getMatchRules };
