'use strict';

const db = require('../db');

async function findByYear(year) {
  const result = await db.query(
    `SELECT s.*, t.name AS team_name, t.code AS team_code, t.flag_url
     FROM standings s
     JOIN teams t ON t.id = s.team_id
     JOIN tournaments tr ON tr.id = s.tournament_id
     WHERE tr.year = $1
     ORDER BY s.group_name, s.points DESC, (s.goals_for - s.goals_against) DESC`,
    [parseInt(year, 10)]
  );
  return result.rows;
}

async function findByYearAndGroup(year, groupName) {
  const result = await db.query(
    `SELECT s.*, t.name AS team_name, t.code AS team_code, t.flag_url
     FROM standings s
     JOIN teams t ON t.id = s.team_id
     JOIN tournaments tr ON tr.id = s.tournament_id
     WHERE tr.year = $1 AND s.group_name = $2
     ORDER BY s.points DESC, (s.goals_for - s.goals_against) DESC`,
    [parseInt(year, 10), groupName.toUpperCase()]
  );
  return result.rows;
}

async function upsert(standing) {
  const {
    tournament_id, team_id, group_name,
    played, won, drawn, lost,
    goals_for, goals_against, points,
  } = standing;

  const result = await db.query(
    `INSERT INTO standings
       (tournament_id, team_id, group_name, played, won, drawn, lost, goals_for, goals_against, points)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (tournament_id, team_id) DO UPDATE
       SET group_name     = EXCLUDED.group_name,
           played         = EXCLUDED.played,
           won            = EXCLUDED.won,
           drawn          = EXCLUDED.drawn,
           lost           = EXCLUDED.lost,
           goals_for      = EXCLUDED.goals_for,
           goals_against  = EXCLUDED.goals_against,
           points         = EXCLUDED.points,
           updated_at     = NOW()
     RETURNING *`,
    [tournament_id, team_id, group_name, played, won, drawn, lost, goals_for, goals_against, points]
  );
  return result.rows[0];
}

module.exports = { findByYear, findByYearAndGroup, upsert };
