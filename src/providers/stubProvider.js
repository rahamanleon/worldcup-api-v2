'use strict';

const LiveProvider = require('./providerInterface');

/**
 * Stub provider — returns synthetic live data.
 * Used when provider = "stub" in config.json, or as fallback.
 * Replace or supplement with a real provider for production.
 */
class StubProvider extends LiveProvider {
  async fetchLiveMatches() {
    // Simulate a match in progress
    const minute = Math.floor(Date.now() / 1000) % 90 + 1;

    return [
      {
        externalId:   'stub-2026-001',
        homeTeamCode: 'BRA',
        awayTeamCode: 'ARG',
        homeScore:    1,
        awayScore:    1,
        status:       'live',
        minute,
        matchDate:    new Date().toISOString(),
        stage:        'group',
        groupName:    'C',
        venue:        'MetLife Stadium',
        city:         'East Rutherford',
      },
    ];
  }

  async fetchMatchById(externalId) {
    const matches = await this.fetchLiveMatches();
    return matches.find((m) => m.externalId === externalId) || null;
  }
}

module.exports = StubProvider;
