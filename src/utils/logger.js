'use strict';

const config = require('../config');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const configuredLevel = LEVELS[config.logging?.level] ?? LEVELS.info;

function log(level, message, meta = {}) {
  if (LEVELS[level] < configuredLevel) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const out = level === 'error' ? process.stderr : process.stdout;
  out.write(JSON.stringify(entry) + '\n');
}

module.exports = {
  debug: (msg, meta) => log('debug', msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
