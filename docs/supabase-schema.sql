-- Tapped In — Supabase PostgreSQL Schema
-- Run in Supabase SQL Editor: supabase.com → your project → SQL Editor
-- Supabase Auth user IDs (auth.users.id, a UUID) are used as the foreign key.

-- ── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age                   SMALLINT NOT NULL CHECK (age BETWEEN 13 AND 100),
  sex                   TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  height_cm             NUMERIC(5,1) NOT NULL,
  weight_kg             NUMERIC(5,1) NOT NULL,
  body_fat_percent      NUMERIC(4,1),
  experience            TEXT NOT NULL CHECK (experience IN ('beginner', 'intermediate', 'advanced')),
  training_days_per_week SMALLINT NOT NULL CHECK (training_days_per_week BETWEEN 0 AND 7),
  cardio_frequency      SMALLINT NOT NULL CHECK (cardio_frequency BETWEEN 0 AND 7),
  cardio_duration_min   SMALLINT NOT NULL,
  daily_steps           INT NOT NULL,
  sitting_hours_per_day SMALLINT NOT NULL CHECK (sitting_hours_per_day BETWEEN 0 AND 20),
  job_type              TEXT NOT NULL CHECK (job_type IN ('desk_job', 'light_activity', 'moderate_activity', 'heavy_labor')),
  goal_mode             TEXT NOT NULL CHECK (goal_mode IN ('fat_loss', 'recomp', 'muscle_gain', 'maintain')),
  deficit_level         TEXT CHECK (deficit_level IN ('mild', 'moderate', 'aggressive')),
  unit_system           TEXT NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Meal logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_logs (
  id                    TEXT PRIMARY KEY,          -- client-generated UUID
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  meal_type             TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack','pre_workout','post_workout')),
  ingredients           JSONB NOT NULL DEFAULT '[]',
  oil_entry             JSONB,
  logged_at             TIMESTAMPTZ NOT NULL,
  date_key              TEXT NOT NULL,             -- YYYY-MM-DD
  is_cooked             BOOLEAN NOT NULL DEFAULT FALSE,
  cooked_weight_grams   NUMERIC(6,1),
  total_calories        NUMERIC(7,1) NOT NULL,
  total_protein_g       NUMERIC(6,1) NOT NULL,
  total_carbs_g         NUMERIC(6,1) NOT NULL,
  total_fat_g           NUMERIC(6,1) NOT NULL,
  log_method            TEXT NOT NULL DEFAULT 'manual' CHECK (log_method IN ('manual', 'ai_scan')),
  ai_scan_confidence    TEXT CHECK (ai_scan_confidence IN ('high', 'medium', 'low')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meal_logs_user_date ON meal_logs (user_id, date_key);

-- ── Row Level Security ───────────────────────────────────────
-- Supabase Auth issues the JWT; auth.uid() returns the authenticated user's
-- UUID (the `sub` claim) inside RLS policies. No extra JWT config needed.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/write their own row
CREATE POLICY "profiles_self" ON profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Meal logs: users can only read/write their own rows
CREATE POLICY "meal_logs_self" ON meal_logs
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
