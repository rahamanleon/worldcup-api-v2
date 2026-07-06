'use strict';

const { param } = require('express-validator');

const getStandingsRules = [
  param('year').isInt({ min: 1930, max: 2100 }).toInt(),
];

const getGroupRules = [
  param('year').isInt({ min: 1930, max: 2100 }).toInt(),
  param('group').isLength({ min: 1, max: 2 }).matches(/^[A-Ha-h]$/).withMessage('Group must be A–H'),
];

module.exports = { getStandingsRules, getGroupRules };
