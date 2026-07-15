'use strict';

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('FATAL: DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres pool error:', err);
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  sector       TEXT NOT NULL DEFAULT '',
  product      TEXT NOT NULL DEFAULT 'Jais',
  priority     TEXT NOT NULL DEFAULT 'Medium',
  use_case     TEXT NOT NULL DEFAULT '',
  why          TEXT NOT NULL DEFAULT '',
  stage        TEXT NOT NULL DEFAULT 'Not Started',
  next_steps   TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts (
  id         SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT '',
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partners (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  offering   TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration: the K2 Think product option was removed; fold existing rows into Jais.
UPDATE accounts SET product = 'Jais' WHERE product = 'K2 Think';

-- Added later: manually-uploaded logos (stored as small data URLs).
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';

-- Added later: account profile fields shown in the detail drawer.
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS website     TEXT NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone       TEXT NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS hq          TEXT NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS employees   TEXT NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS org_size    TEXT NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
`;

async function init() {
  await pool.query(SCHEMA);
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  init,
};
