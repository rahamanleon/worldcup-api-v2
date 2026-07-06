'use strict';

const express     = require('express');
const adminAuth   = require('../middleware/auth');
const liveService = require('../services/liveIngestionService');
const cache       = require('../utils/cache');
const respond     = require('../utils/respond');

const router = express.Router();

// All admin routes require Bearer token
router.use(adminAuth);

/**
 * POST /api/v1/admin/ingest
 * Manually trigger a live ingestion cycle.
 */
router.post('/ingest', async (req, res) => {
  try {
    await liveService.ingestLiveMatches();
    return respond.ok(res, { message: 'Ingestion triggered' });
  } catch (err) {
    return respond.serverError(res, err.message);
  }
});

/**
 * POST /api/v1/admin/cache/flush
 * Flush the entire in-memory cache.
 */
router.post('/cache/flush', (req, res) => {
  cache.flush();
  return respond.ok(res, { message: 'Cache flushed' });
});

module.exports = router;
