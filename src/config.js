'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(
      'config.json not found. Copy config.example.json to config.json and fill in your values.'
    );
  }

  let raw;
  try {
    raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read config.json: ${err.message}`);
  }

  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch (err) {
    throw new Error(`config.json is not valid JSON: ${err.message}`);
  }

  // Minimal required field assertions
  const required = [
    ['server', 'port'],
    ['database', 'url'],
    ['auth', 'adminToken'],
  ];

  for (const [section, key] of required) {
    if (!cfg[section] || cfg[section][key] === undefined) {
      throw new Error(`config.json is missing required field: ${section}.${key}`);
    }
  }

  return cfg;
}

// Load once at startup; treat as immutable
const config = loadConfig();

module.exports = config;
