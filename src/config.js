'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const EXAMPLE_PATH = path.join(__dirname, '..', 'config.example.json');

function loadConfig() {
  // Try config.json first, fall back to config.example.json
  const configFile = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : EXAMPLE_PATH;

  if (!fs.existsSync(configFile)) {
    throw new Error(
      'No config file found. Create config.json from config.example.json.'
    );
  }

  let raw;
  try {
    raw = fs.readFileSync(configFile, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read ${configFile}: ${err.message}`);
  }

  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${configFile} is not valid JSON: ${err.message}`);
  }

  // ── Environment variable overrides ─────────────────────────────────────
  // These take precedence over file-based config, useful for Render/Docker
  if (process.env.PORT) {
    cfg.server = cfg.server || {};
    cfg.server.port = parseInt(process.env.PORT, 10);
  }
  if (process.env.HOST) {
    cfg.server = cfg.server || {};
    cfg.server.host = process.env.HOST;
  }
  if (process.env.NODE_ENV) {
    cfg.server = cfg.server || {};
    cfg.server.nodeEnv = process.env.NODE_ENV;
  }
  if (process.env.DATABASE_URL) {
    cfg.database = cfg.database || {};
    cfg.database.url = process.env.DATABASE_URL;
  }
  if (process.env.ADMIN_TOKEN) {
    cfg.auth = cfg.auth || {};
    cfg.auth.adminToken = process.env.ADMIN_TOKEN;
  }
  if (process.env.LIVE_PROVIDER) {
    cfg.live = cfg.live || {};
    cfg.live.provider = process.env.LIVE_PROVIDER;
  }
  if (process.env.LOG_LEVEL) {
    cfg.logging = cfg.logging || {};
    cfg.logging.level = process.env.LOG_LEVEL;
  }

  // Minimal required field assertions (after env overrides)
  const required = [
    ['server', 'port'],
    ['database', 'url'],
  ];

  for (const [section, key] of required) {
    if (!cfg[section] || cfg[section][key] === undefined) {
      throw new Error(`Missing required config: ${section}.${key}. Set in config.json or as env var.`);
    }
  }

  // auth.adminToken only required for admin routes; warn if missing
  if (!cfg.auth || !cfg.auth.adminToken) {
    console.warn('[config] WARNING: auth.adminToken not set — admin endpoints will be unavailable');
  }

  return cfg;
}

// Load once at startup; treat as immutable
const config = loadConfig();

module.exports = config;
