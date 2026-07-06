'use strict';

const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load config directly (can't use src/config.js before DB is ready)
const configPath = path.join(__dirname, '..', 'config.json');
const config     = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
});

const MIGRATIONS_DIR = __dirname;

async function run() {
  const client = await pool.connect();

  try {
    // Track which migrations have run
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       TEXT        PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows: applied } = await client.query('SELECT name FROM _migrations');
    const appliedSet = new Set(applied.map((r) => r.name));

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[skip]  ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[ok]    ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[fail]  ${file}: ${err.message}`);
        process.exit(1);
      }
    }

    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration runner error:', err.message);
  process.exit(1);
});
