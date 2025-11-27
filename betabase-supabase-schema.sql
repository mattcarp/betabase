-- ============================================================================
-- BETABASE SCHEMA CREATION
-- Paste this into Supabase SQL Editor to create the tables
-- Note: Tables will be created in public schema with betabase_ prefix
-- ============================================================================

-- Table: betabase_application (10 rows)
CREATE TABLE IF NOT EXISTS application (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  primary_color VARCHAR(255)
);

-- Table: user (30 rows)
CREATE TABLE IF NOT EXISTS "user" (
  id INTEGER PRIMARY KEY,
  username VARCHAR(180),
  username_canonical VARCHAR(180),
  email VARCHAR(180),
  email_canonical VARCHAR(180),
  enabled SMALLINT NOT NULL DEFAULT 0,
  salt VARCHAR(255),
  password VARCHAR(255),
  last_login VARCHAR(255),
  locked SMALLINT NOT NULL DEFAULT 0,
  expired SMALLINT NOT NULL DEFAULT 0,
  expires_at VARCHAR(255),
  confirmation_token VARCHAR(180),
  password_requested_at VARCHAR(255),
  roles TEXT NOT NULL DEFAULT 'a:0:{}',
  credentials_expired SMALLINT NOT NULL DEFAULT 0,
  credentials_expire_at VARCHAR(255),
  created_at VARCHAR(255),
  updated_at VARCHAR(255),
  f_name VARCHAR(255),
  l_name VARCHAR(255),
  jira_username VARCHAR(255),
  is_notified SMALLINT,
  mobile_phone VARCHAR(255),
  org VARCHAR(255)
);

-- Table: round (154 rows)
CREATE TABLE IF NOT EXISTS round (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  starts_at VARCHAR(255),
  ends_at VARCHAR(255),
  updated_at VARCHAR(255),
  release_num VARCHAR(255),
  app VARCHAR(255),
  notes TEXT,
  created_at VARCHAR(255),
  client_notes TEXT,
  current_flag SMALLINT,
  release_date VARCHAR(255)
);

-- Table: variation (67 rows)
CREATE TABLE IF NOT EXISTS variation (
  id INTEGER PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  variation_text TEXT,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at VARCHAR(255),
  updated_at VARCHAR(255)
);

-- Table: cases (1,359 rows)
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER,
  app_under_test VARCHAR(5),
  name VARCHAR(254),
  script VARCHAR(1376),
  expected_result VARCHAR(462),
  tags VARCHAR(92),
  created_by VARCHAR(19),
  created_at VARCHAR(19),
  updated_by VARCHAR(19),
  updated_at VARCHAR(19),
  preconditions VARCHAR(590)
);

-- Table: deployment (1,793 rows)
CREATE TABLE IF NOT EXISTS deployment (
  id INTEGER PRIMARY KEY,
  build VARCHAR(255),
  branch VARCHAR(255),
  app_under_test VARCHAR(255),
  deployed_at VARCHAR(255),
  record_inserted_at VARCHAR(255)
);

-- Table: scenario (8,449 rows) - CORE TABLE
CREATE TABLE IF NOT EXISTS scenario (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  script TEXT,
  expected_result TEXT,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  preconditions TEXT,
  created_at VARCHAR(255),
  updated_at VARCHAR(255),
  review_flag SMALLINT,
  flag_reason TEXT,
  app_under_test VARCHAR(255),
  tags VARCHAR(255),
  coverage VARCHAR(255),
  client_priority SMALLINT,
  mode VARCHAR(255),
  is_security SMALLINT,
  priority_sort_order INTEGER,
  enhancement_sort_order INTEGER,
  current_regression_sort_order INTEGER,
  reviewed_flag VARCHAR(255)
);

-- Table: test (34,631 rows) - CORE TABLE
CREATE TABLE IF NOT EXISTS test (
  id INTEGER PRIMARY KEY,
  scenario_id INTEGER,
  created_at VARCHAR(255),
  comments TEXT,
  ticket VARCHAR(255),
  created_by VARCHAR(255),
  input TEXT,
  result TEXT,
  pass_fail VARCHAR(255),
  build VARCHAR(255),
  updated_at VARCHAR(255),
  updated_by VARCHAR(255),
  path VARCHAR(255),
  browser_name VARCHAR(255),
  browser_major VARCHAR(255),
  browser_minor VARCHAR(255),
  os_name VARCHAR(255),
  os_major VARCHAR(255),
  os_minor VARCHAR(255),
  deployment_stamp VARCHAR(255),
  in_prod VARCHAR(255)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_scenario_id ON test(scenario_id);
CREATE INDEX IF NOT EXISTS idx_variation_scenario_id ON variation(scenario_id);
CREATE INDEX IF NOT EXISTS idx_test_pass_fail ON test(pass_fail);
CREATE INDEX IF NOT EXISTS idx_test_created_at ON test(created_at);
CREATE INDEX IF NOT EXISTS idx_scenario_app_under_test ON scenario(app_under_test);
CREATE INDEX IF NOT EXISTS idx_scenario_tags ON scenario(tags);
CREATE INDEX IF NOT EXISTS idx_test_build ON test(build);
CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

-- Enable RLS (Row Level Security) but allow all access for now
ALTER TABLE application ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE round ENABLE ROW LEVEL SECURITY;
ALTER TABLE variation ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario ENABLE ROW LEVEL SECURITY;
ALTER TABLE test ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (adjust as needed)
CREATE POLICY "Allow all access to application" ON application FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to user" ON "user" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to round" ON round FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to variation" ON variation FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to cases" ON cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to deployment" ON deployment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to scenario" ON scenario FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to test" ON test FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- Next step: Use the data import script to populate these tables
-- ============================================================================
