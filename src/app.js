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

  // ── Root endpoint — API info ──────────────────────────────────────────────
  app.get('/', (req, res) => {
    res.json({
      name: 'World Cup API',
      version: '2.0.0',
      description: 'Free FIFA World Cup REST API — historical archive + live scores',
      docs: 'https://github.com/rahamanleon/worldcup-api-v2',
      endpoints: {
        health:       '/health',
        tournaments:  '/api/v1/tournaments',
        teams:        '/api/v1/teams',
        matches:      '/api/v1/matches',
        live:         '/api/v1/live',
        standings:    '/api/v1/standings/:year',
        groups:       '/api/v1/groups/:year/:group',
        search:       '/api/v1/search?q=',
        admin:        '/api/v1/admin',
      },
    });
  });

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
