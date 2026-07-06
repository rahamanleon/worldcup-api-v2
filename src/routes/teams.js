'use strict';

const express      = require('express');
const controller   = require('../controllers/teamController');
const schemas      = require('../schemas/teamSchemas');
const validate     = require('../middleware/validate');
const { cacheFor } = require('../middleware/cacheHeaders');

const router = express.Router();

router.get('/',
  schemas.listTeamsRules,
  validate,
  cacheFor(3600),
  controller.listTeams
);

router.get('/:id',
  schemas.getTeamRules,
  validate,
  cacheFor(3600),
  controller.getTeam
);

module.exports = router;
