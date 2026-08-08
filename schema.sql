-- Run this once against your database to create the users table.
-- psql -U <user> -d <database> -f schema.sql

-- Needed for gen_random_uuid() on Postgres < 16 (13+ has it via pgcrypto;
-- 16+ has it built into core, but this is a harmless no-op there too).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  age         INTEGER CHECK (age IS NULL OR age >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
