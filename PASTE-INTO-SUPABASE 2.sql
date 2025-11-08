-- ================================================================
-- RLHF DATABASE SETUP - Ready to Paste into Supabase SQL Editor
-- ================================================================
-- Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 2. Copy this ENTIRE file
-- 3. Paste into SQL Editor
-- 4. Click "Run" or press Cmd+Enter
-- ================================================================

-- Step 1: Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'curator', 'viewer')),
  organization TEXT NOT NULL DEFAULT 'sony-music',
  division TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role, permission)
);

-- Step 3: Create rlhf_feedback table
CREATE TABLE IF NOT EXISTS rlhf_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  thumbs_up BOOLEAN,
  documents_marked JSONB,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_rlhf_conversation ON rlhf_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_rlhf_user ON rlhf_feedback(user_email);
CREATE INDEX IF NOT EXISTS idx_rlhf_created ON rlhf_feedback(created_at DESC);

-- Step 5: Insert default permissions
INSERT INTO role_permissions (role, permission, description) VALUES
  ('admin', 'rlhf_feedback', 'Can provide RLHF feedback on AI responses'),
  ('admin', 'view_analytics', 'Can view analytics and dashboards'),
  ('admin', 'manage_vectors', 'Can manage vector store data'),
  ('admin', 'manage_users', 'Can manage user roles and permissions'),
  ('curator', 'rlhf_feedback', 'Can provide RLHF feedback on AI responses'),
  ('curator', 'view_analytics', 'Can view analytics and dashboards'),
  ('viewer', 'view_analytics', 'Can view analytics and dashboards')
ON CONFLICT (role, permission) DO NOTHING;

-- Step 6: Insert default admin users
-- IMPORTANT: Update these emails to match your actual users!
INSERT INTO user_roles (email, role, organization) VALUES
  ('matt@mattcarpenter.com', 'admin', 'sony-music'),
  ('fiona@fionaburgess.com', 'admin', 'sony-music'),
  ('curator@example.com', 'curator', 'sony-music')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 7: Enable RLS (Row Level Security)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rlhf_feedback ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS Policies for user_roles
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

DROP POLICY IF EXISTS "Service role full access on user_roles" ON user_roles;
CREATE POLICY "Service role full access on user_roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 9: RLS Policies for role_permissions
DROP POLICY IF EXISTS "Authenticated users can read permissions" ON role_permissions;
CREATE POLICY "Authenticated users can read permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access on role_permissions" ON role_permissions;
CREATE POLICY "Service role full access on role_permissions"
  ON role_permissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 10: RLS Policies for rlhf_feedback
DROP POLICY IF EXISTS "Users can read own feedback" ON rlhf_feedback;
CREATE POLICY "Users can read own feedback"
  ON rlhf_feedback
  FOR SELECT
  TO authenticated
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

DROP POLICY IF EXISTS "Users can insert own feedback" ON rlhf_feedback;
CREATE POLICY "Users can insert own feedback"
  ON rlhf_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

DROP POLICY IF EXISTS "Service role full access on rlhf_feedback" ON rlhf_feedback;
CREATE POLICY "Service role full access on rlhf_feedback"
  ON rlhf_feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Done! Verify results:
SELECT 'Setup Complete! ✅' as status;
SELECT 'User Roles:' as info, COUNT(*) as count FROM user_roles;
SELECT 'Permissions:' as info, COUNT(*) as count FROM role_permissions;
SELECT 'RLHF Feedback Table:' as info, 'Ready' as status FROM rlhf_feedback LIMIT 0;

