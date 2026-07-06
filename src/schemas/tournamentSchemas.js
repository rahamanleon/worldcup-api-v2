'use strict';

const { param } = require('express-validator');

const getTournamentRules = [
  param('year').isInt({ min: 1930, max: 2100 }).toInt().withMessage('Year must be a valid World Cup year'),
];

module.exports = { getTournamentRules };
