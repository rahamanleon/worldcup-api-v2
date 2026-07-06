#!/usr/bin/env node
'use strict';

/**
 * Import script — load any external JSON dataset into the DB.
 *
 * Usage:
 *   node scripts/import.js --type matches   --year 2018 --file ./my_matches.json
 *   node scripts/import.js --type standings --year 2018 --file ./my_standings.json
 *   node scripts/import.js --type teams     --file ./my_teams.json
 *
 * JSON shape must match the seed data format in seeds/data/.
 */

const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const configPath = path.join(__dirname, '..', 'config.json');
const config     = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
});

// ── Arg parsing ───────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const get  = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
  };
  return {
    type: get('--type'),
    year: get('--year') ? parseInt(get('--year'), 10) : null,
    file: get('--file'),
  };
}

function usage() {
  console.error(`
Usage:
  node scripts/import.js --type <teams|matches|standings> --file <path> [--year <YYYY>]

  --type       What to import: teams, matches, or standings
  --file       Path to the JSON file
  --year       Required for matches and standings
`);
  process.exit(1);
}

// ── DB helpers ────────────────────────────────────────────────────────────

async function getTeamIdMap(client) {
  const { rows } = await client.query('SELECT id, code FROM teams');
  return new Map(rows.map((r) => [r.code.trim(), r.id]));
}

async function getTournamentId(client, year) {
  const { rows } = await client.query('SELECT id FROM tournaments WHERE year = $1', [year]);
  if (!rows.length) throw new Error(`Tournament ${year} not found. Run seed first.`);
  return rows[0].id;
}

// ── Importers ─────────────────────────────────────────────────────────────

async function importTeams(client, records) {
  let ok = 0;
  for (const t of records) {
    await client.query(
      `INSERT INTO teams (code, name, flag_url, confederation)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             flag_url = EXCLUDED.flag_url,
             confederation = EXCLUDED.confederation,
             updated_at = NOW()`,
      [t.code, t.name, t.flag_url || null, t.confederation || null]
    );
    ok++;
  }
  return ok;
}

async function importMatches(client, records, year) {
  const teamMap      = await getTeamIdMap(client);
  const tournamentId = await getTournamentId(client, year);
  let ok = 0, skipped = 0;

  for (const m of records) {
    const homeId = teamMap.get((m.home_team || '').toUpperCase());
    const awayId = teamMap.get((m.away_team || '').toUpperCase());

    if (!homeId || !awayId) {
      console.warn(`  [skip] Unknown team: ${m.home_team} / ${m.away_team}`);
      skipped++;
      continue;
    }

    await client.query(
      `INSERT INTO matches
         (tournament_id, home_team_id, away_team_id, stage, group_name,
          match_date, venue, city, home_score, away_score,
          home_score_penalties, away_score_penalties, status, external_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (external_id) DO UPDATE
         SET home_score           = EXCLUDED.home_score,
             away_score           = EXCLUDED.away_score,
             home_score_penalties = EXCLUDED.home_score_penalties,
             away_score_penalties = EXCLUDED.away_score_penalties,
             status               = EXCLUDED.status,
             updated_at           = NOW()`,
      [
        tournamentId, homeId, awayId,
        m.stage, m.group_name || null,
        m.match_date, m.venue || null, m.city || null,
        m.home_score ?? null, m.away_score ?? null,
        m.home_score_penalties ?? null, m.away_score_penalties ?? null,
        m.status || 'scheduled', m.external_id,
      ]
    );
    ok++;
  }

  if (skipped) console.warn(`  ${skipped} matches skipped due to unknown teams.`);
  return ok;
}

async function importStandings(client, records, year) {
  const teamMap      = await getTeamIdMap(client);
  const tournamentId = await getTournamentId(client, year);
  let ok = 0, skipped = 0;

  for (const s of records) {
    const teamId = teamMap.get((s.team || '').toUpperCase());
    if (!teamId) {
      console.warn(`  [skip] Unknown team: ${s.team}`);
      skipped++;
      continue;
    }

    await client.query(
      `INSERT INTO standings
         (tournament_id, team_id, group_name, played, won, drawn, lost, goals_for, goals_against, points)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (tournament_id, team_id) DO UPDATE
         SET group_name    = EXCLUDED.group_name,
             played        = EXCLUDED.played,
             won           = EXCLUDED.won,
             drawn         = EXCLUDED.drawn,
             lost          = EXCLUDED.lost,
             goals_for     = EXCLUDED.goals_for,
             goals_against = EXCLUDED.goals_against,
             points        = EXCLUDED.points,
             updated_at    = NOW()`,
      [tournamentId, teamId, s.group, s.played, s.won, s.drawn, s.lost, s.goals_for, s.goals_against, s.points]
    );
    ok++;
  }

  if (skipped) console.warn(`  ${skipped} standings skipped.`);
  return ok;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const { type, year, file } = parseArgs();

  if (!type || !file)                                usage();
  if ((type === 'matches' || type === 'standings') && !year) {
    console.error('--year is required for matches and standings');
    usage();
  }

  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  const records = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(records)) {
    console.error('JSON file must contain an array');
    process.exit(1);
  }

  console.log(`Importing ${records.length} ${type} record(s)…`);

  const client = await pool.connect();
  try {
    let count;
    if      (type === 'teams')     count = await importTeams(client, records);
    else if (type === 'matches')   count = await importMatches(client, records, year);
    else if (type === 'standings') count = await importStandings(client, records, year);
    else { console.error(`Unknown type: ${type}`); usage(); }

    console.log(`Done — ${count} records imported ✓`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
