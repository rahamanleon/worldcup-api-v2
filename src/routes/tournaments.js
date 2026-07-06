'use strict';

const express      = require('express');
const controller   = require('../controllers/tournamentController');
const schemas      = require('../schemas/tournamentSchemas');
const validate     = require('../middleware/validate');
const { cacheFor } = require('../middleware/cacheHeaders');

const router = express.Router();

router.get('/',
  cacheFor(3600),
  controller.listTournaments
);

router.get('/:year',
  schemas.getTournamentRules,
  validate,
  cacheFor(3600),
  controller.getTournament
);

module.exports = router;
