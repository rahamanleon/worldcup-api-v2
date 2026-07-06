-- ============================================================
-- Migration 001 — Initial World Cup API Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── teams ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code          CHAR(3)     NOT NULL UNIQUE,          -- e.g. BRA, ARG, FRA
  name          VARCHAR(100) NOT NULL,
  flag_url      TEXT,
  confederation VARCHAR(20),                          -- UEFA, CONMEBOL, etc.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_name ON teams (name);
CREATE INDEX IF NOT EXISTS idx_teams_code ON teams (code);

-- ── tournaments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  year                INT     NOT NULL UNIQUE,
  host_country        VARCHAR(100),
  winner_team_id      UUID    REFERENCES teams(id),
  runner_up_team_id   UUID    REFERENCES teams(id),
  third_place_team_id UUID    REFERENCES teams(id),
  total_matches       INT,
  total_goals         INT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_year ON tournaments (year);

-- ── matches ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id         UUID        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  home_team_id          UUID        NOT NULL REFERENCES teams(id),
  away_team_id          UUID        NOT NULL REFERENCES teams(id),
  stage                 VARCHAR(30) NOT NULL,   -- group|round_of_16|quarter_final|semi_final|third_place|final
  group_name            CHAR(1),                -- A-H, NULL for knockout
  match_date            TIMESTAMPTZ NOT NULL,
  venue                 VARCHAR(150),
  city                  VARCHAR(100),
  home_score            INT,
  away_score            INT,
  home_score_penalties  INT,
  away_score_penalties  INT,
  status                VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled','live','finished','postponed','canceled')),
  minute                INT,
  external_id           VARCHAR(100) UNIQUE,    -- provider's match ID for upserts
  last_fetched_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_tournament  ON matches (tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status      ON matches (status);
CREATE INDEX IF NOT EXISTS idx_matches_date        ON matches (match_date);
CREATE INDEX IF NOT EXISTS idx_matches_external_id ON matches (external_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team   ON matches (home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team   ON matches (away_team_id);

-- ── standings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS standings (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID    NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id         UUID    NOT NULL REFERENCES teams(id),
  group_name      CHAR(1) NOT NULL,
  played          INT     NOT NULL DEFAULT 0,
  won             INT     NOT NULL DEFAULT 0,
  drawn           INT     NOT NULL DEFAULT 0,
  lost            INT     NOT NULL DEFAULT 0,
  goals_for       INT     NOT NULL DEFAULT 0,
  goals_against   INT     NOT NULL DEFAULT 0,
  points          INT     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_standings_tournament ON standings (tournament_id);
CREATE INDEX IF NOT EXISTS idx_standings_group      ON standings (group_name);

-- ── updated_at triggers ──────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['teams','tournaments','matches','standings'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
       CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON %s
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t, t, t
    );
  END LOOP;
END;
$$;
