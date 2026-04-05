-- ============================================================
-- DMIS — Disaster Management Information System
-- Full Schema for Supabase (PostgreSQL)
-- Run this ONCE in the Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. ENUM TYPES
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE severity_level    AS ENUM ('Low', 'Medium', 'High', 'Critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE urgency_level     AS ENUM ('Low', 'Moderate', 'Critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE resource_type     AS ENUM ('Food', 'Medical', 'Shelter', 'Equipment', 'Water');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alloc_status      AS ENUM ('Available', 'Partially Allocated', 'Fully Allocated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status       AS ENUM ('Pending', 'Ongoing', 'Completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('Active', 'Completed', 'Revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role         AS ENUM ('admin', 'volunteer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ────────────────────────────────────────────────────────────
-- 1. profiles (extends auth.users 1:1)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  region        TEXT,
  skills        TEXT[],
  availability  BOOLEAN DEFAULT TRUE,
  role          user_role NOT NULL DEFAULT 'volunteer',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile row on every new Supabase auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, region, skills, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'region',
    CASE
      WHEN NEW.raw_user_meta_data->'skills' IS NOT NULL
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'skills'))
      ELSE NULL
    END,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'volunteer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 2. disasters
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disasters (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL,
  region      TEXT NOT NULL,
  severity    severity_level NOT NULL DEFAULT 'Medium',
  date        DATE NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────
-- 3. affected_areas
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affected_areas (
  id           SERIAL PRIMARY KEY,
  disaster_id  INT NOT NULL REFERENCES disasters(id) ON DELETE CASCADE,
  area_name    TEXT NOT NULL,
  urgency      urgency_level NOT NULL DEFAULT 'Low',
  latitude     NUMERIC(10, 7),
  longitude    NUMERIC(10, 7),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────
-- 4. resources
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id             SERIAL PRIMARY KEY,
  disaster_id    INT NOT NULL REFERENCES disasters(id) ON DELETE CASCADE,
  type           resource_type NOT NULL,
  quantity       INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  alloc_status   alloc_status NOT NULL DEFAULT 'Available',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────
-- 5. tasks
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              SERIAL PRIMARY KEY,
  disaster_id     INT NOT NULL REFERENCES disasters(id) ON DELETE CASCADE,
  area_id         INT NOT NULL REFERENCES affected_areas(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  required_skill  TEXT NOT NULL,
  status          task_status NOT NULL DEFAULT 'Pending',
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────
-- 6. resource_allocations (M:N — resources ↔ tasks)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resource_allocations (
  id             SERIAL PRIMARY KEY,
  resource_id    INT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  task_id        INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  quantity_used  INT NOT NULL CHECK (quantity_used > 0),
  allocated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (resource_id, task_id)
);

-- Trigger: auto-decrement resource quantity & update alloc_status on INSERT
CREATE OR REPLACE FUNCTION update_resource_on_allocation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE resources
  SET quantity = quantity - NEW.quantity_used
  WHERE id = NEW.resource_id AND quantity >= NEW.quantity_used;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient resource quantity for resource_id=%', NEW.resource_id;
  END IF;

  UPDATE resources
  SET alloc_status = CASE
    WHEN quantity = 0 THEN 'Fully Allocated'::alloc_status
    ELSE 'Partially Allocated'::alloc_status
  END
  WHERE id = NEW.resource_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resource_allocation ON resource_allocations;
CREATE TRIGGER trg_resource_allocation
  AFTER INSERT ON resource_allocations
  FOR EACH ROW EXECUTE FUNCTION update_resource_on_allocation();


-- ────────────────────────────────────────────────────────────
-- 7. assignments (M:N — volunteers ↔ tasks)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id             SERIAL PRIMARY KEY,
  task_id        INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  volunteer_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  status         assignment_status NOT NULL DEFAULT 'Active',
  UNIQUE (task_id, volunteer_id)
);


-- ────────────────────────────────────────────────────────────
-- 8. disaster_reports (Weak Entity)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disaster_reports (
  id              SERIAL,
  disaster_id     INT NOT NULL REFERENCES disasters(id) ON DELETE CASCADE,
  report_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  summary         TEXT NOT NULL,
  resources_used  JSONB,
  tasks_completed INT DEFAULT 0,
  created_by      UUID REFERENCES profiles(id),
  PRIMARY KEY (id, disaster_id)
);


-- ────────────────────────────────────────────────────────────
-- 9. notifications
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  event_type   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────────
-- 10. PERFORMANCE INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_areas_disaster       ON affected_areas(disaster_id);
CREATE INDEX IF NOT EXISTS idx_resources_disaster   ON resources(disaster_id);
CREATE INDEX IF NOT EXISTS idx_tasks_disaster       ON tasks(disaster_id);
CREATE INDEX IF NOT EXISTS idx_tasks_area           ON tasks(area_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_assignments_task     ON assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_assignments_vol      ON assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_alloc_resource       ON resource_allocations(resource_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recip  ON notifications(recipient_id);


-- ────────────────────────────────────────────────────────────
-- 11. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE disasters              ENABLE ROW LEVEL SECURITY;
ALTER TABLE affected_areas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources              ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE disaster_reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── profiles ──
DROP POLICY IF EXISTS "Public read profiles"          ON profiles;
DROP POLICY IF EXISTS "Volunteer updates own profile" ON profiles;
DROP POLICY IF EXISTS "Admin full access on profiles" ON profiles;

CREATE POLICY "Public read profiles"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY "Volunteer updates own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin full access on profiles"
  ON profiles FOR ALL USING (get_my_role() = 'admin');

-- ── disasters ──
DROP POLICY IF EXISTS "Public read disasters"  ON disasters;
DROP POLICY IF EXISTS "Admin manage disasters" ON disasters;

CREATE POLICY "Public read disasters"
  ON disasters FOR SELECT USING (TRUE);

CREATE POLICY "Admin manage disasters"
  ON disasters FOR ALL USING (get_my_role() = 'admin');

-- ── affected_areas ──
DROP POLICY IF EXISTS "Public read areas"  ON affected_areas;
DROP POLICY IF EXISTS "Admin manage areas" ON affected_areas;

CREATE POLICY "Public read areas"
  ON affected_areas FOR SELECT USING (TRUE);

CREATE POLICY "Admin manage areas"
  ON affected_areas FOR ALL USING (get_my_role() = 'admin');

-- ── resources ──
DROP POLICY IF EXISTS "Public read resources"  ON resources;
DROP POLICY IF EXISTS "Admin manage resources" ON resources;

CREATE POLICY "Public read resources"
  ON resources FOR SELECT USING (TRUE);

CREATE POLICY "Admin manage resources"
  ON resources FOR ALL USING (get_my_role() = 'admin');

-- ── tasks ──
DROP POLICY IF EXISTS "Public read tasks"  ON tasks;
DROP POLICY IF EXISTS "Admin manage tasks" ON tasks;

CREATE POLICY "Public read tasks"
  ON tasks FOR SELECT USING (TRUE);

CREATE POLICY "Admin manage tasks"
  ON tasks FOR ALL USING (get_my_role() = 'admin');

-- ── assignments ──
DROP POLICY IF EXISTS "Volunteer sees own assignments"        ON assignments;
DROP POLICY IF EXISTS "Volunteer updates own assignment status" ON assignments;
DROP POLICY IF EXISTS "Admin manages all assignments"         ON assignments;

CREATE POLICY "Volunteer sees own assignments"
  ON assignments FOR SELECT
  USING (volunteer_id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "Volunteer updates own assignment status"
  ON assignments FOR UPDATE
  USING (volunteer_id = auth.uid());

CREATE POLICY "Admin manages all assignments"
  ON assignments FOR ALL USING (get_my_role() = 'admin');

-- ── notifications ──
DROP POLICY IF EXISTS "Volunteer reads own notifications"  ON notifications;
DROP POLICY IF EXISTS "Volunteer marks notification read"  ON notifications;
DROP POLICY IF EXISTS "Admin sends notifications"          ON notifications;

CREATE POLICY "Volunteer reads own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "Volunteer marks notification read"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid());

CREATE POLICY "Admin sends notifications"
  ON notifications FOR INSERT WITH CHECK (get_my_role() = 'admin');

-- ── resource_allocations ──
DROP POLICY IF EXISTS "Admin manages resource allocations"    ON resource_allocations;
DROP POLICY IF EXISTS "Volunteer reads own task allocations"  ON resource_allocations;

CREATE POLICY "Admin manages resource allocations"
  ON resource_allocations FOR ALL USING (get_my_role() = 'admin');

CREATE POLICY "Volunteer reads own task allocations"
  ON resource_allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.task_id = resource_allocations.task_id
        AND a.volunteer_id = auth.uid()
    )
  );

-- ── disaster_reports ──
DROP POLICY IF EXISTS "Admin manages reports" ON disaster_reports;

CREATE POLICY "Admin manages reports"
  ON disaster_reports FOR ALL USING (get_my_role() = 'admin');


-- ────────────────────────────────────────────────────────────
-- 12. REALTIME — enable tables for live subscriptions
-- ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE disasters;
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE resource_allocations;


-- ============================================================
-- DONE — Schema applied successfully
-- ============================================================
