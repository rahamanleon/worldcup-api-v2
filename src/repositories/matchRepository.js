'use strict';

const db = require('../db');

const BASE_SELECT = `
  SELECT
    m.*,
    ht.name  AS home_team_name, ht.code AS home_team_code, ht.flag_url AS home_flag,
    at.name  AS away_team_name, at.code AS away_team_code, at.flag_url AS away_flag,
    t.host_country
  FROM matches m
  JOIN teams ht ON ht.id = m.home_team_id
  JOIN teams at ON at.id = m.away_team_id
  JOIN tournaments t ON t.id = m.tournament_id
`;

async function findAll({ limit, offset, tournamentYear, stage, status, sort = 'match_date', order = 'ASC' }) {
  const ALLOWED_SORT  = ['match_date', 'home_score', 'away_score', 'stage'];
  const ALLOWED_ORDER = ['ASC', 'DESC'];
  const col = ALLOWED_SORT.includes(sort) ? sort : 'match_date';
  const dir = ALLOWED_ORDER.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

  const conditions = [];
  const params = [];

  if (tournamentYear) {
    params.push(parseInt(tournamentYear, 10));
    conditions.push(`t.year = $${params.length}`);
  }
  if (stage) {
    params.push(stage);
    conditions.push(`m.stage = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`m.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM matches m JOIN tournaments t ON t.id = m.tournament_id ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await db.query(
    `${BASE_SELECT} ${where} ORDER BY m.${col} ${dir} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: result.rows, total };
}

async function findById(id) {
  const result = await db.query(`${BASE_SELECT} WHERE m.id = $1`, [id]);
  return result.rows[0] || null;
}

async function findLive() {
  const result = await db.query(
    `${BASE_SELECT} WHERE m.status = 'live' ORDER BY m.match_date ASC`
  );
  return result.rows;
}

async function upsert(match) {
  const {
    tournament_id, home_team_id, away_team_id, stage, group_name,
    match_date, venue, city, home_score, away_score,
    home_score_penalties, away_score_penalties,
    status, minute, external_id,
  } = match;

  const result = await db.query(
    `INSERT INTO matches
       (tournament_id, home_team_id, away_team_id, stage, group_name,
        match_date, venue, city, home_score, away_score,
        home_score_penalties, away_score_penalties,
        status, minute, external_id, last_fetched_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, NOW())
     ON CONFLICT (external_id) DO UPDATE
       SET home_score             = EXCLUDED.home_score,
           away_score             = EXCLUDED.away_score,
           home_score_penalties   = EXCLUDED.home_score_penalties,
           away_score_penalties   = EXCLUDED.away_score_penalties,
           status                 = EXCLUDED.status,
           minute                 = EXCLUDED.minute,
           last_fetched_at        = NOW(),
           updated_at             = NOW()
     RETURNING *`,
    [
      tournament_id, home_team_id, away_team_id, stage, group_name,
      match_date, venue, city, home_score ?? null, away_score ?? null,
      home_score_penalties ?? null, away_score_penalties ?? null,
      status, minute ?? null, external_id,
    ]
  );
  return result.rows[0];
}

/**
 * Partial update — only update changed live fields.
 */
async function updateLiveFields(id, { home_score, away_score, status, minute }) {
  const result = await db.query(
    `UPDATE matches
     SET home_score      = $2,
         away_score      = $3,
         status          = $4,
         minute          = $5,
         last_fetched_at = NOW(),
         updated_at      = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, home_score ?? null, away_score ?? null, status, minute ?? null]
  );
  return result.rows[0] || null;
}

async function findByExternalId(externalId) {
  const result = await db.query(
    `${BASE_SELECT} WHERE m.external_id = $1`,
    [externalId]
  );
  return result.rows[0] || null;
}

async function search(q) {
  const result = await db.query(
    `${BASE_SELECT}
     WHERE ht.name ILIKE $1 OR at.name ILIKE $1 OR m.venue ILIKE $1 OR m.city ILIKE $1
     ORDER BY m.match_date DESC
     LIMIT 20`,
    [`%${q}%`]
  );
  return result.rows;
}

module.exports = { findAll, findById, findLive, findByExternalId, upsert, updateLiveFields, search };
