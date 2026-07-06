'use strict';

const fetch = require('node-fetch');
const LiveProvider = require('./providerInterface');
const config       = require('../config');
const logger       = require('../utils/logger');

/**
 * Adapter for football-data.org (free tier: 10 req/min, no live scores).
 *
 * Set provider = "football-data" in config.json and add:
 *   "footballData": { "apiKey": "YOUR_FREE_TOKEN", "competitionId": "WC" }
 *
 * The free plan returns scheduled/finished statuses only.
 * For real live data you would need a paid source.
 */
class FootballDataProvider extends LiveProvider {
  constructor() {
    super();
    this.baseUrl = 'https://api.football-data.org/v4';
    this.apiKey  = config.footballData?.apiKey || '';
    this.competitionId = config.footballData?.competitionId || 'WC';
  }

  _headers() {
    return { 'X-Auth-Token': this.apiKey };
  }

  async _get(path) {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this._headers() });
    if (!res.ok) {
      throw new Error(`football-data.org ${path} → HTTP ${res.status}`);
    }
    return res.json();
  }

  /** Map football-data status strings to our canonical set */
  _mapStatus(fdStatus) {
    const map = {
      SCHEDULED:  'scheduled',
      LIVE:       'live',
      IN_PLAY:    'live',
      PAUSED:     'live',
      FINISHED:   'finished',
      POSTPONED:  'postponed',
      CANCELLED:  'canceled',
      SUSPENDED:  'postponed',
    };
    return map[fdStatus] || 'scheduled';
  }

  async fetchLiveMatches() {
    try {
      const data = await this._get(`/competitions/${this.competitionId}/matches?status=LIVE,IN_PLAY`);
      return (data.matches || []).map(this._normalize.bind(this));
    } catch (err) {
      logger.warn('FootballDataProvider.fetchLiveMatches failed', { error: err.message });
      return [];
    }
  }

  async fetchMatchById(externalId) {
    try {
      const data = await this._get(`/matches/${externalId}`);
      return this._normalize(data);
    } catch (err) {
      logger.warn('FootballDataProvider.fetchMatchById failed', { externalId, error: err.message });
      return null;
    }
  }

  _normalize(m) {
    return {
      externalId:   String(m.id),
      homeTeamCode: m.homeTeam?.tla || m.homeTeam?.shortName || '',
      awayTeamCode: m.awayTeam?.tla || m.awayTeam?.shortName || '',
      homeScore:    m.score?.fullTime?.home ?? null,
      awayScore:    m.score?.fullTime?.away ?? null,
      status:       this._mapStatus(m.status),
      minute:       null, // not provided on free tier
      matchDate:    m.utcDate,
      stage:        (m.stage || '').toLowerCase(),
      groupName:    m.group ? m.group.replace('GROUP_', '') : null,
      venue:        null,
      city:         null,
    };
  }
}

module.exports = FootballDataProvider;
