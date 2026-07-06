'use strict';

const express      = require('express');
const controller   = require('../controllers/standingsController');
const schemas      = require('../schemas/standingsSchemas');
const validate     = require('../middleware/validate');
const { cacheFor } = require('../middleware/cacheHeaders');

const router = express.Router();

router.get('/:year',
  schemas.getStandingsRules,
  validate,
  cacheFor(300),
  controller.getStandings
);

module.exports = router;
