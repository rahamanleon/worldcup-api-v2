'use strict';

const express      = require('express');
const controller   = require('../controllers/matchController');
const { noCache }  = require('../middleware/cacheHeaders');

const router = express.Router();

// Live scores must never be cached by CDN/browser
router.get('/', noCache, controller.getLive);

module.exports = router;
