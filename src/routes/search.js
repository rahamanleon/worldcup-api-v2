'use strict';

const express      = require('express');
const controller   = require('../controllers/searchController');
const { query }    = require('express-validator');
const validate     = require('../middleware/validate');

const router = express.Router();

router.get('/',
  [query('q').isString().isLength({ min: 2, max: 100 }).withMessage('q must be 2–100 characters')],
  validate,
  controller.search
);

module.exports = router;
