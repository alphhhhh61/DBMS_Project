-- ============================================================
-- DMIS — Fix "permission denied for schema public"
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Grant schema usage to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant table-level privileges to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 3. Grant sequence usage (needed for SERIAL/auto-increment columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Grant anon read-only access (for public SELECT policies)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 5. Ensure future tables also get these grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

-- ============================================================
-- DONE — Permissions fixed
-- ============================================================
