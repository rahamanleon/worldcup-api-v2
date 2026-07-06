'use strict';

const config = require('../config');

const PROVIDERS = {
  stub:          () => new (require('./stubProvider'))(),
  'football-data': () => new (require('./footballDataProvider'))(),
};

/**
 * Return the configured live data provider.
 * Defaults to stub if the configured provider is not found.
 */
function getProvider() {
  const name = config.live?.provider || 'stub';
  const factory = PROVIDERS[name];

  if (!factory) {
    throw new Error(`Unknown live provider: "${name}". Valid options: ${Object.keys(PROVIDERS).join(', ')}`);
  }

  return factory();
}

module.exports = { getProvider };
