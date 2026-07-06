'use strict';

const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const configPath = path.join(__dirname, '..', 'config.json');
const config     = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
});

const DATA = path.join(__dirname, 'data');

function load(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function query(client, text, params) {
  try {
    return await client.query(text, params);
  } catch (err) {
    console.error('Query error:', err.message, '\nSQL:', text);
    throw err;
  }
}

async function upsertTeam(client, t) {
  const result = await query(client,
    `INSERT INTO teams (code, name, flag_url, confederation)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name,
           flag_url = EXCLUDED.flag_url,
           confederation = EXCLUDED.confederation,
           updated_at = NOW()
     RETURNING id, code`,
    [t.code, t.name, t.flag_url || null, t.confederation || null]
  );
  return result.rows[0];
}

async function upsertTournament(client, t, teamIdMap) {
  const winnerId      = t.winner      ? teamIdMap.get(t.winner)      : null;
  const runnerUpId    = t.runner_up   ? teamIdMap.get(t.runner_up)   : null;
  const thirdPlaceId  = t.third_place ? teamIdMap.get(t.third_place) : null;

  const result = await query(client,
    `INSERT INTO tournaments
       (year, host_country, winner_team_id, runner_up_team_id, third_place_team_id, total_matches, total_goals)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (year) DO UPDATE
       SET host_country        = EXCLUDED.host_country,
           winner_team_id      = EXCLUDED.winner_team_id,
           runner_up_team_id   = EXCLUDED.runner_up_team_id,
           third_place_team_id = EXCLUDED.third_place_team_id,
           total_matches       = EXCLUDED.total_matches,
           total_goals         = EXCLUDED.total_goals,
           updated_at          = NOW()
     RETURNING id, year`,
    [t.year, t.host_country, winnerId, runnerUpId, thirdPlaceId, t.total_matches || null, t.total_goals || null]
  );
  return result.rows[0];
}

async function upsertMatch(client, m, tournamentId, teamIdMap) {
  const homeTeamId = teamIdMap.get(m.home_team);
  const awayTeamId = teamIdMap.get(m.away_team);

  if (!homeTeamId || !awayTeamId) {
    console.warn(`  [skip] Unknown team in match ${m.external_id}: ${m.home_team} vs ${m.away_team}`);
    return null;
  }

  const result = await query(client,
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
           updated_at           = NOW()
     RETURNING id`,
    [
      tournamentId, homeTeamId, awayTeamId,
      m.stage, m.group_name || null,
      m.match_date, m.venue || null, m.city || null,
      m.home_score !== undefined ? m.home_score : null,
      m.away_score !== undefined ? m.away_score : null,
      m.home_score_penalties || null, m.away_score_penalties || null,
      m.status || 'scheduled', m.external_id,
    ]
  );
  return result.rows[0];
}

async function upsertStanding(client, s, tournamentId, teamIdMap) {
  const teamId = teamIdMap.get(s.team);
  if (!teamId) {
    console.warn(`  [skip] Unknown team in standing: ${s.team}`);
    return null;
  }

  await query(client,
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
}

// ── Main ──────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();

  try {
    // 1. Teams
    console.log('Seeding teams…');
    const teamsData = load('teams.json');
    const teamIdMap = new Map(); // code → UUID

    for (const t of teamsData) {
      const row = await upsertTeam(client, t);
      teamIdMap.set(row.code.trim(), row.id);
    }
    console.log(`  ${teamsData.length} teams done.`);

    // 2. Tournaments
    console.log('Seeding tournaments…');
    const tournamentsData = load('tournaments.json');
    const tournamentIdMap = new Map(); // year → UUID

    for (const t of tournamentsData) {
      const row = await upsertTournament(client, t, teamIdMap);
      tournamentIdMap.set(row.year, row.id);
    }
    console.log(`  ${tournamentsData.length} tournaments done.`);

    // 3. Matches — load all match files matching matches_YYYY.json
    console.log('Seeding matches…');
    const matchFiles = fs.readdirSync(DATA).filter((f) => f.startsWith('matches_') && f.endsWith('.json'));
    let totalMatches = 0;

    for (const file of matchFiles) {
      const year = parseInt(file.replace('matches_', '').replace('.json', ''), 10);
      const tournamentId = tournamentIdMap.get(year);
      if (!tournamentId) {
        console.warn(`  [skip] No tournament found for year ${year} (${file})`);
        continue;
      }

      const matches = load(file);
      for (const m of matches) {
        await upsertMatch(client, m, tournamentId, teamIdMap);
        totalMatches++;
      }
      console.log(`  ${matches.length} matches for ${year}`);
    }
    console.log(`  ${totalMatches} total matches done.`);

    // 4. Standings — load all standings_YYYY.json files
    console.log('Seeding standings…');
    const standingFiles = fs.readdirSync(DATA).filter((f) => f.startsWith('standings_') && f.endsWith('.json'));
    let totalStandings = 0;

    for (const file of standingFiles) {
      const year = parseInt(file.replace('standings_', '').replace('.json', ''), 10);
      const tournamentId = tournamentIdMap.get(year);
      if (!tournamentId) {
        console.warn(`  [skip] No tournament for year ${year} (${file})`);
        continue;
      }

      const rows = load(file);
      for (const s of rows) {
        await upsertStanding(client, s, tournamentId, teamIdMap);
        totalStandings++;
      }
      console.log(`  ${rows.length} standings for ${year}`);
    }
    console.log(`  ${totalStandings} total standings done.`);

    console.log('\nSeed complete ✓');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
