# World Cup API

Free, open REST API for FIFA World Cup historical data and live scores.

## Stack

- Node.js 18+ / Express
- PostgreSQL (any free-tier: Supabase, Neon, Render)
- In-memory TTL cache (swap-ready for Redis/Cloudflare KV)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and edit config
cp config.example.json config.json
# Edit config.json: set database.url and auth.adminToken

# 3. Run migrations
npm run migrate

# 4. Seed historical data
npm run seed

# 5. Start server
npm start

# Development (auto-restart)
npm run dev
```

## Endpoints

| Method | Path                              | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | /health                           | Health check + DB status           |
| GET    | /api/v1/tournaments               | All World Cup tournaments          |
| GET    | /api/v1/tournaments/:year         | Tournament by year                 |
| GET    | /api/v1/teams                     | All teams (paginated)              |
| GET    | /api/v1/teams/:id                 | Team by UUID                       |
| GET    | /api/v1/matches                   | Matches (filterable, paginated)    |
| GET    | /api/v1/matches/:id               | Match by UUID                      |
| GET    | /api/v1/live                      | Currently live matches             |
| GET    | /api/v1/standings/:year           | Group standings by year            |
| GET    | /api/v1/groups/:year/:group       | Single group table (A–H)           |
| GET    | /api/v1/search?q=                 | Search teams and matches           |

### Match filters

```
GET /api/v1/matches?tournament=2022&stage=group&status=finished&sort=match_date&order=ASC&page=1&limit=20
```

### Admin (Bearer token required)

```bash
# Trigger live ingestion manually
curl -X POST /api/v1/admin/ingest \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Flush cache
curl -X POST /api/v1/admin/cache/flush \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Live Providers

Set `live.provider` in `config.json`:

| Value            | Description                                      |
|------------------|--------------------------------------------------|
| `stub`           | Synthetic data — no external calls (default)     |
| `football-data`  | football-data.org free tier (requires API key)   |

To add a new provider, implement `src/providers/providerInterface.js` and register it in `src/providers/index.js`.

## Deploy to Render (free tier)

1. Push repo to GitHub
2. Create a new **Web Service** on Render pointing to your repo
3. Set **Start command**: `npm start`
4. Add a **PostgreSQL** database (free tier)
5. Set environment variable `DATABASE_URL` — or mount `config.json` as a secret file

## Adding More Match Data

Drop additional `seeds/data/matches_YYYY.json` or `seeds/data/standings_YYYY.json` files following the existing format, then re-run:

```bash
npm run seed
```

The seeder is fully idempotent — safe to run multiple times.
