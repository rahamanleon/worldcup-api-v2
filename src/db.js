'use strict';

const { Pool } = require('pg');
const config = require('./config');
const logger = require('./utils/logger');

const pool = new Pool({
  connectionString: config.database.url,
  min: config.database.poolMin || 2,
  max: config.database.poolMax || 10,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

/**
 * Execute a parameterized query.
 * @param {string} text  - SQL string with $1, $2… placeholders
 * @param {Array}  params
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params = []) {
  const start = Date.now();
  const result = await pool.query(text, params);
  logger.debug('DB query', { ms: Date.now() - start, rows: result.rowCount, sql: text });
  return result;
}

/**
 * Acquire a client for multi-statement transactions.
 */
async function getClient() {
  return pool.connect();
}

module.exports = { query, getClient, pool };
