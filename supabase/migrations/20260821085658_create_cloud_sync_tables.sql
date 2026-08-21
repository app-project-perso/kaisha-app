/*
# Cloud sync tables for Caisse Agent (backup/sync layer)

## Purpose
This migration creates the Supabase-side mirror tables for the offline-first
Caisse Agent PWA. The app continues to read/write exclusively from IndexedDB
(Dexie) for all user-facing operations. These tables serve as a cloud backup
and enable cross-device restoration when an agent logs in on a new device.

## New Tables

1. `profiles`
   - `id` (uuid, PK, references auth.users) — one row per agent
   - `cash_point_nom` (text, optional) — human-readable name for the agent's cash point
   - `created_at` (timestamptz)

2. `clotures` (cloud mirror of local closures)
   - `id` (uuid, PK) — same UUID generated client-side
   - `agent_id` (uuid, NOT NULL, DEFAULT auth.uid(), references profiles) — owner
   - `date` (date, NOT NULL)
   - `cash_calcule`, `orange_calcule`, `mvola_calcule`, `airtel_calcule` (numeric, NOT NULL)
   - `cash_reel`, `orange_reel`, `mvola_reel`, `airtel_reel` (numeric, NOT NULL)
   - `ecarts` (jsonb, NOT NULL) — { cash, orange, mvola, airtel }
   - `nb_transactions` (integer, NOT NULL)
   - `volume_total` (numeric, NOT NULL)
   - `created_at` (timestamptz)

3. `transactions` (cloud mirror of local IndexedDB transactions)
   - `id` (uuid, PK) — same UUID generated client-side
   - `agent_id` (uuid, NOT NULL, DEFAULT auth.uid(), references profiles) — owner
   - `operateur` (text, NOT NULL) — 'orange' | 'mvola' | 'airtel'
   - `type` (text, NOT NULL) — 'depot' | 'retrait'
   - `montant` (numeric, NOT NULL)
   - `date_heure` (timestamptz, NOT NULL)
   - `numero_telephone` (text, nullable)
   - `cloture_id` (uuid, nullable) — references clotures(id) when transaction is closed
   - `created_at` (timestamptz)

4. `config` (cloud mirror of local agent config — one row per agent)
   - `agent_id` (uuid, PK, DEFAULT auth.uid(), references profiles) — owner and primary key
   - `cash_solde_initial`, `orange_solde_initial`, `mvola_solde_initial`, `airtel_solde_initial` (numeric, NOT NULL, default 0)
   - `seuils` (jsonb, NOT NULL) — { cash, orange, mvola, airtel }
   - `onboarding_termine` (boolean, NOT NULL, default false)
   - `updated_at` (timestamptz)

## Security (RLS)
- RLS enabled on ALL four tables.
- All policies scoped TO authenticated with agent_id = auth.uid() ownership checks.
- agent_id columns default to auth.uid() so client-side inserts that omit agent_id still pass the WITH CHECK constraint.
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE) — no FOR ALL.

## Notes
1. The `config` table uses `agent_id` as its primary key (one config row per agent).
2. `transactions.cloture_id` references `clotures.id` with ON DELETE SET NULL so deleting a closure doesn't lose transaction history.
3. All numeric columns use `numeric(14,2)` for monetary precision in Ariary.
4. Tables are created in dependency order: profiles → clotures → transactions → config.
*/

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_point_nom text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
  ON profiles FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- clotures table (cloud mirror)
CREATE TABLE IF NOT EXISTS clotures (
  id uuid PRIMARY KEY,
  agent_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  cash_calcule numeric(14,2) NOT NULL,
  orange_calcule numeric(14,2) NOT NULL,
  mvola_calcule numeric(14,2) NOT NULL,
  airtel_calcule numeric(14,2) NOT NULL,
  cash_reel numeric(14,2) NOT NULL,
  orange_reel numeric(14,2) NOT NULL,
  mvola_reel numeric(14,2) NOT NULL,
  airtel_reel numeric(14,2) NOT NULL,
  ecarts jsonb NOT NULL,
  nb_transactions integer NOT NULL,
  volume_total numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clotures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_clotures" ON clotures;
CREATE POLICY "select_own_clotures"
  ON clotures FOR SELECT TO authenticated
  USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "insert_own_clotures" ON clotures;
CREATE POLICY "insert_own_clotures"
  ON clotures FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "update_own_clotures" ON clotures;
CREATE POLICY "update_own_clotures"
  ON clotures FOR UPDATE TO authenticated
  USING (auth.uid() = agent_id) WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "delete_own_clotures" ON clotures;
CREATE POLICY "delete_own_clotures"
  ON clotures FOR DELETE TO authenticated
  USING (auth.uid() = agent_id);

CREATE INDEX IF NOT EXISTS idx_clotures_agent_id ON clotures(agent_id);
CREATE INDEX IF NOT EXISTS idx_clotures_date ON clotures(date DESC);

-- transactions table (cloud mirror)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY,
  agent_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  operateur text NOT NULL CHECK (operateur IN ('orange', 'mvola', 'airtel')),
  type text NOT NULL CHECK (type IN ('depot', 'retrait')),
  montant numeric(14,2) NOT NULL,
  date_heure timestamptz NOT NULL,
  numero_telephone text,
  cloture_id uuid REFERENCES clotures(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions"
  ON transactions FOR SELECT TO authenticated
  USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions"
  ON transactions FOR UPDATE TO authenticated
  USING (auth.uid() = agent_id) WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions"
  ON transactions FOR DELETE TO authenticated
  USING (auth.uid() = agent_id);

CREATE INDEX IF NOT EXISTS idx_transactions_agent_id ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_heure ON transactions(date_heure DESC);

-- config table (cloud mirror — one row per agent)
CREATE TABLE IF NOT EXISTS config (
  agent_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  cash_solde_initial numeric(14,2) NOT NULL DEFAULT 0,
  orange_solde_initial numeric(14,2) NOT NULL DEFAULT 0,
  mvola_solde_initial numeric(14,2) NOT NULL DEFAULT 0,
  airtel_solde_initial numeric(14,2) NOT NULL DEFAULT 0,
  seuils jsonb NOT NULL DEFAULT '{"cash":20000,"orange":20000,"mvola":20000,"airtel":20000}'::jsonb,
  onboarding_termine boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_config" ON config;
CREATE POLICY "select_own_config"
  ON config FOR SELECT TO authenticated
  USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "insert_own_config" ON config;
CREATE POLICY "insert_own_config"
  ON config FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "update_own_config" ON config;
CREATE POLICY "update_own_config"
  ON config FOR UPDATE TO authenticated
  USING (auth.uid() = agent_id) WITH CHECK (auth.uid() = agent_id);

DROP POLICY IF EXISTS "delete_own_config" ON config;
CREATE POLICY "delete_own_config"
  ON config FOR DELETE TO authenticated
  USING (auth.uid() = agent_id);
