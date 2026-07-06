'use strict';

const express       = require('express');
const requestLogger = require('./middleware/requestLogger');
const errorHandler  = require('./middleware/errorHandler');
const v1Routes      = require('./routes/index');
const healthRouter  = require('./routes/health');

function createApp() {
  const app = express();

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  // ── Security basics ───────────────────────────────────────────────────────
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // for correct req.ip behind Render/CF proxy

  // ── Request logging ───────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/health',    healthRouter);
  app.use('/api/v1',    v1Routes);

  // ── 404 catch-all ─────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ success: false, error: { status: 404, message: 'Not found' } });
  });

  // ── Global error handler ──────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
