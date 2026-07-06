# World Cup API v2

Free, open REST API for FIFA World Cup historical data and live scores.

🌐 **Live:** [https://worldcup-api-v2.onrender.com](https://worldcup-api-v2.onrender.com)

## Stack

- Node.js 18+ / Express
- PostgreSQL (any free-tier: Supabase, Neon, Render)
- In-memory TTL cache (swap-ready for Redis/Cloudflare KV)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure
cp config.example.json config.json

# 3. Run migrations & seed data
npm run setup

# 4. Start server
npm start
```

### Configuration via Environment Variables

All config values can be overridden with environment variables — ideal for Render, Docker, and CI/CD:

| Env Var            | Overrides              |
|--------------------|------------------------|
| `PORT`             | `server.port`          |
| `HOST`             | `server.host`          |
| `NODE_ENV`         | `server.nodeEnv`       |
| `DATABASE_URL`     | `database.url`         |
| `ADMIN_TOKEN`      | `auth.adminToken`      |
| `LIVE_PROVIDER`    | `live.provider`        |
| `LOG_LEVEL`        | `logging.level`        |

## Endpoints

| Method | Path                              | Description                        |
|--------|-----------------------------------|------------------------------------|
| GET    | /                                 | API info + available endpoints     |
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

### Admin (Bearer token required)

```bash
curl -X POST /api/v1/admin/ingest \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST /api/v1/admin/cache/flush \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Live Providers

| Provider         | Description                                    |
|------------------|------------------------------------------------|
| `stub`           | Synthetic data — no external calls (default)   |
| `football-data`  | football-data.org free tier (requires API key) |

## Deploy to Render

1. Push repo to GitHub
2. Create a new **Web Service** on Render
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add a **PostgreSQL** database
6. Set env vars: `DATABASE_URL`, `ADMIN_TOKEN`, `NODE_ENV=production`

## Docker

```bash
docker build -t worldcup-api-v2 .
docker run -p 3000:3000 -e DATABASE_URL=... -e ADMIN_TOKEN=... worldcup-api-v2
```

## Adding Match Data

Drop `seeds/data/matches_YYYY.json` or `seeds/data/standings_YYYY.json` files, then:

```bash
npm run seed
```

The seeder is fully idempotent — safe to run multiple times.
