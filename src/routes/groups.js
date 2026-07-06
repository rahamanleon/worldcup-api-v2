'use strict';

const express      = require('express');
const controller   = require('../controllers/standingsController');
const schemas      = require('../schemas/standingsSchemas');
const validate     = require('../middleware/validate');
const { cacheFor } = require('../middleware/cacheHeaders');

const router = express.Router();

router.get('/:year/:group',
  schemas.getGroupRules,
  validate,
  cacheFor(300),
  controller.getGroup
);

module.exports = router;
