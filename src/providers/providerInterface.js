'use strict';

/**
 * LiveProvider interface contract.
 *
 * All live data providers must implement these methods.
 * Return null/[] on failure — the ingestion layer handles fallback.
 *
 * @interface
 */
class LiveProvider {
  /**
   * Fetch current live matches from the upstream source.
   * @returns {Promise<LiveMatch[]>}
   */
  async fetchLiveMatches() {
    throw new Error('fetchLiveMatches() not implemented');
  }

  /**
   * Fetch a single match by its external ID.
   * @param {string} externalId
   * @returns {Promise<LiveMatch|null>}
   */
  async fetchMatchById(_externalId) {
    throw new Error('fetchMatchById() not implemented');
  }
}

/**
 * @typedef {object} LiveMatch
 * @property {string}      externalId
 * @property {string}      homeTeamCode
 * @property {string}      awayTeamCode
 * @property {number|null} homeScore
 * @property {number|null} awayScore
 * @property {string}      status          - scheduled|live|finished|postponed|canceled
 * @property {number|null} minute
 * @property {string}      matchDate       - ISO timestamp
 * @property {string}      stage
 * @property {string|null} groupName
 * @property {string|null} venue
 * @property {string|null} city
 */

module.exports = LiveProvider;
