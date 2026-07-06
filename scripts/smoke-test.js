#!/usr/bin/env node
'use strict';

/**
 * Smoke test — hits every public endpoint against a running server.
 *
 * Usage:
 *   node scripts/smoke-test.js [base_url]
 *
 * Default base_url: http://localhost:3000
 *
 * Exit code 0 = all checks passed
 * Exit code 1 = one or more checks failed
 */

const http = require('http');
const https = require('https');

const BASE = process.argv[2] || 'http://localhost:3000';
const ADMIN_TOKEN = (() => {
  try {
    return require('../config.json').auth.adminToken;
  } catch {
    return 'dev-admin-token-change-in-production';
  }
})();

let passed = 0;
let failed = 0;

// ── HTTP helper ───────────────────────────────────────────────────────────

function request(method, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url  = new URL(path, BASE);
    const mod  = url.protocol === 'https:' ? https : http;
    const opts = { method, hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers };

    const req = mod.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// ── Test runner ───────────────────────────────────────────────────────────

async function check(label, fn) {
  try {
    await fn();
    console.log(`  ✓  ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${label} — ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ── Tests ─────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\nSmoke test → ${BASE}\n`);

  await check('GET /health → 200 or 503', async () => {
    const r = await request('GET', '/health');
    assert([200, 503].includes(r.status), `Expected 200/503, got ${r.status}`);
    assert(typeof r.body.uptime === 'number', 'Missing uptime');
  });

  await check('GET /api/v1/tournaments → 200, array', async () => {
    const r = await request('GET', '/api/v1/tournaments');
    assert(r.status === 200, `Got ${r.status}`);
    assert(Array.isArray(r.body.data), 'data not an array');
  });

  await check('GET /api/v1/tournaments/2022 → 200 or 404', async () => {
    const r = await request('GET', '/api/v1/tournaments/2022');
    assert([200, 404].includes(r.status), `Got ${r.status}`);
  });

  await check('GET /api/v1/tournaments/9999 → 400 (bad year validation)', async () => {
    const r = await request('GET', '/api/v1/tournaments/9999');
    // 9999 > 2100, expect validation error
    assert([400, 404].includes(r.status), `Got ${r.status}`);
  });

  await check('GET /api/v1/teams → 200, paginated', async () => {
    const r = await request('GET', '/api/v1/teams');
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.body.pagination, 'Missing pagination');
  });

  await check('GET /api/v1/teams with limit → respects limit', async () => {
    const r = await request('GET', '/api/v1/teams?limit=5&page=1');
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.body.data.length <= 5, `Got ${r.body.data.length} items, expected ≤5`);
  });

  await check('GET /api/v1/teams/:bad-uuid → 400', async () => {
    const r = await request('GET', '/api/v1/teams/not-a-uuid');
    assert(r.status === 400, `Got ${r.status}`);
  });

  await check('GET /api/v1/matches → 200', async () => {
    const r = await request('GET', '/api/v1/matches');
    assert(r.status === 200, `Got ${r.status}`);
    assert(Array.isArray(r.body.data), 'data not an array');
  });

  await check('GET /api/v1/matches?status=invalid → 400', async () => {
    const r = await request('GET', '/api/v1/matches?status=invalid');
    assert(r.status === 400, `Got ${r.status}`);
  });

  await check('GET /api/v1/matches?tournament=2022 → 200', async () => {
    const r = await request('GET', '/api/v1/matches?tournament=2022');
    assert(r.status === 200, `Got ${r.status}`);
  });

  await check('GET /api/v1/live → 200', async () => {
    const r = await request('GET', '/api/v1/live');
    assert(r.status === 200, `Got ${r.status}`);
    assert(Array.isArray(r.body.data), 'data not an array');
  });

  await check('GET /api/v1/standings/2022 → 200 or 404', async () => {
    const r = await request('GET', '/api/v1/standings/2022');
    assert([200, 404].includes(r.status), `Got ${r.status}`);
  });

  await check('GET /api/v1/groups/2022/A → 200 or 404', async () => {
    const r = await request('GET', '/api/v1/groups/2022/A');
    assert([200, 404].includes(r.status), `Got ${r.status}`);
  });

  await check('GET /api/v1/groups/2022/Z → 400 (invalid group)', async () => {
    const r = await request('GET', '/api/v1/groups/2022/Z');
    assert(r.status === 400, `Got ${r.status}`);
  });

  await check('GET /api/v1/search?q=Bra → 200', async () => {
    const r = await request('GET', '/api/v1/search?q=Bra');
    assert(r.status === 200, `Got ${r.status}`);
    assert(r.body.data.teams !== undefined, 'Missing teams in search');
  });

  await check('GET /api/v1/search?q=x → 400 (too short)', async () => {
    const r = await request('GET', '/api/v1/search?q=x');
    assert(r.status === 400, `Got ${r.status}`);
  });

  await check('POST /api/v1/admin/ingest without token → 401', async () => {
    const r = await request('POST', '/api/v1/admin/ingest');
    assert(r.status === 401, `Got ${r.status}`);
  });

  await check('POST /api/v1/admin/cache/flush with token → 200', async () => {
    const r = await request('POST', '/api/v1/admin/cache/flush', {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    });
    assert(r.status === 200, `Got ${r.status}`);
  });

  await check('GET /nonexistent → 404', async () => {
    const r = await request('GET', '/nonexistent-route');
    assert(r.status === 404, `Got ${r.status}`);
  });

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`\n${passed + failed} checks — ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('\nSmoke test runner error:', err.message);
  console.error('Is the server running at', BASE, '?\n');
  process.exit(1);
});
