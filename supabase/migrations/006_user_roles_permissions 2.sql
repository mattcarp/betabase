-- User Roles & Permissions System
-- Implements RBAC for RLHF feedback UI access control
-- Date: 2025-01-05
-- Authors: Claude Sonnet 4.5 - Advanced RLHF RAG Implementation

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

-- Step 3: Insert default permissions
INSERT INTO role_permissions (role, permission, description) VALUES
  ('admin', 'rlhf_feedback', 'Can provide RLHF feedback on AI responses'),
  ('admin', 'view_analytics', 'Can view analytics and dashboards'),
  ('admin', 'manage_vectors', 'Can manage vector store data'),
  ('admin', 'manage_users', 'Can manage user roles and permissions'),
  ('curator', 'rlhf_feedback', 'Can provide RLHF feedback on AI responses'),
  ('curator', 'view_analytics', 'Can view analytics and dashboards'),
  ('viewer', 'view_analytics', 'Can view analytics and dashboards')
ON CONFLICT (role, permission) DO NOTHING;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles(organization, division);

-- Step 5: Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies for user_roles
-- Allow users to read their own role
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow service role full access
CREATE POLICY "Service role full access on user_roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 7: RLS Policies for role_permissions
-- Allow all authenticated users to read permissions (they need this to check their own permissions)
CREATE POLICY "Authenticated users can read permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access on role_permissions"
  ON role_permissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 8: Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(
  user_email TEXT,
  required_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  has_perm BOOLEAN;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM user_roles
  WHERE email = user_email;
  
  -- If no role found, return false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if role has the permission
  SELECT EXISTS(
    SELECT 1
    FROM role_permissions
    WHERE role = user_role
    AND permission = required_permission
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$;

-- Step 9: Function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE email = user_email;
  
  RETURN user_role;
END;
$$;

-- Step 10: Function to get all permissions for a role
CREATE OR REPLACE FUNCTION get_role_permissions(user_role TEXT)
RETURNS TABLE(permission TEXT, description TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT rp.permission, rp.description
  FROM role_permissions rp
  WHERE rp.role = user_role;
END;
$$;

-- Step 11: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission TO service_role;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role TO service_role;
GRANT EXECUTE ON FUNCTION get_role_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION get_role_permissions TO service_role;

-- Step 12: Insert default admin users (update these emails as needed)
INSERT INTO user_roles (email, role, organization) VALUES
  ('matt@mattcarpenter.com', 'admin', 'sony-music'),
  ('fiona@fionaburgess.com', 'admin', 'sony-music')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 13: Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 14: Add comments for documentation
COMMENT ON TABLE user_roles IS 'Stores user role assignments for RBAC';
COMMENT ON TABLE role_permissions IS 'Defines which permissions each role has';
COMMENT ON FUNCTION has_permission IS 'Check if a user email has a specific permission';
COMMENT ON FUNCTION get_user_role IS 'Get the role for a user email';
COMMENT ON FUNCTION get_role_permissions IS 'Get all permissions for a given role';

-- Done!
SELECT 'User roles & permissions system created successfully! 🔐' as status;

