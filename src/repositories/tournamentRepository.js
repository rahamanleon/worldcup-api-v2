'use strict';

const db = require('../db');

async function findAll() {
  const result = await db.query(
    'SELECT * FROM tournaments ORDER BY year DESC'
  );
  return result.rows;
}

async function findByYear(year) {
  const result = await db.query(
    'SELECT * FROM tournaments WHERE year = $1',
    [parseInt(year, 10)]
  );
  return result.rows[0] || null;
}

async function upsert({ year, host_country, winner_team_id, runner_up_team_id, third_place_team_id, total_matches, total_goals }) {
  const result = await db.query(
    `INSERT INTO tournaments (year, host_country, winner_team_id, runner_up_team_id, third_place_team_id, total_matches, total_goals)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (year) DO UPDATE
       SET host_country        = EXCLUDED.host_country,
           winner_team_id      = EXCLUDED.winner_team_id,
           runner_up_team_id   = EXCLUDED.runner_up_team_id,
           third_place_team_id = EXCLUDED.third_place_team_id,
           total_matches       = EXCLUDED.total_matches,
           total_goals         = EXCLUDED.total_goals,
           updated_at          = NOW()
     RETURNING *`,
    [year, host_country, winner_team_id, runner_up_team_id, third_place_team_id, total_matches, total_goals]
  );
  return result.rows[0];
}

module.exports = { findAll, findByYear, upsert };
