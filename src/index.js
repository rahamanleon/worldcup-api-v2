'use strict';

const config      = require('./config');
const logger      = require('./utils/logger');
const { createApp } = require('./app');
const liveService = require('./services/liveIngestionService');

const PORT = config.server.port || 3000;
const HOST = config.server.host || '0.0.0.0';

const app = createApp();

const server = app.listen(PORT, HOST, () => {
  logger.info(`World Cup API running`, { host: HOST, port: PORT, env: config.server.nodeEnv });
  liveService.startPolling();
});

// ── Graceful shutdown ─────────────────────────────────────────────────────
function shutdown(signal) {
  logger.info(`${signal} received — shutting down`);
  liveService.stopPolling();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  // Force exit after 10 s if connections are stuck
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});
