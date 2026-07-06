'use strict';

const { pool }  = require('../db');
const respond   = require('../utils/respond');

async function health(req, res) {
  let dbOk = false;
  try {
    await pool.query('SELECT 1');
    dbOk = true;
  } catch (_) { /* intentional */ }

  const status = dbOk ? 200 : 503;
  return res.status(status).json({
    success: dbOk,
    status:  dbOk ? 'ok' : 'degraded',
    db:      dbOk ? 'connected' : 'unreachable',
    uptime:  Math.floor(process.uptime()),
    ts:      new Date().toISOString(),
  });
}

module.exports = { health };
