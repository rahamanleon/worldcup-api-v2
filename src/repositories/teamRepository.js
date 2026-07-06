'use strict';

const db = require('../db');

async function findAll({ limit, offset, sort = 'name', order = 'ASC' }) {
  const ALLOWED_SORT  = ['name', 'code', 'confederation', 'created_at'];
  const ALLOWED_ORDER = ['ASC', 'DESC'];
  const col = ALLOWED_SORT.includes(sort) ? sort : 'name';
  const dir = ALLOWED_ORDER.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

  const countResult = await db.query('SELECT COUNT(*) FROM teams');
  const total = parseInt(countResult.rows[0].count, 10);

  const rows = await db.query(
    `SELECT * FROM teams ORDER BY ${col} ${dir} LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { rows: rows.rows, total };
}

async function findById(id) {
  const result = await db.query('SELECT * FROM teams WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function findByCode(code) {
  const result = await db.query('SELECT * FROM teams WHERE code = $1', [code.toUpperCase()]);
  return result.rows[0] || null;
}

async function upsert({ code, name, flag_url, confederation }) {
  const result = await db.query(
    `INSERT INTO teams (code, name, flag_url, confederation)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name,
           flag_url = EXCLUDED.flag_url,
           confederation = EXCLUDED.confederation,
           updated_at = NOW()
     RETURNING *`,
    [code, name, flag_url, confederation]
  );
  return result.rows[0];
}

async function search(q) {
  const result = await db.query(
    `SELECT * FROM teams
     WHERE name ILIKE $1 OR code ILIKE $1
     ORDER BY name
     LIMIT 20`,
    [`%${q}%`]
  );
  return result.rows;
}

module.exports = { findAll, findById, findByCode, upsert, search };
