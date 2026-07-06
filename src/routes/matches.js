'use strict';

const express          = require('express');
const controller       = require('../controllers/matchController');
const schemas          = require('../schemas/matchSchemas');
const validate         = require('../middleware/validate');
const { cacheFor, noCache } = require('../middleware/cacheHeaders');

const router = express.Router();

router.get('/',
  schemas.listMatchesRules,
  validate,
  cacheFor(60),
  controller.listMatches
);

router.get('/:id',
  schemas.getMatchRules,
  validate,
  cacheFor(60),
  controller.getMatch
);

module.exports = router;
