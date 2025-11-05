#!/usr/bin/env node

/**
 * Execute RLHF migrations directly via Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(description, sql) {
  console.log(`\n📝 ${description}...`);
  try {
    // Use raw SQL execution via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    console.log(`   ✅ Success`);
    return true;
  } catch (error) {
    console.log(`   ⚠️  ${error.message}`);
    return false;
  }
}

async function createUserRolesTable() {
  const sql = `
    -- Create user_roles table
    CREATE TABLE IF NOT EXISTS user_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'curator', 'viewer')),
      organization TEXT NOT NULL DEFAULT 'sony-music',
      division TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
  `;
  
  return executeSQL('Creating user_roles table', sql);
}

async function createRolePermissionsTable() {
  const sql = `
    -- Create role_permissions table
    CREATE TABLE IF NOT EXISTS role_permissions (
      role TEXT NOT NULL,
      permission TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (role, permission)
    );
  `;
  
  return executeSQL('Creating role_permissions table', sql);
}

async function insertDefaultPermissions() {
  const sql = `
    INSERT INTO role_permissions (role, permission, description) VALUES
      ('admin', 'rlhf_feedback', 'Can provide RLHF feedback on AI responses'),
      ('admin', 'view_analytics', 'Can view analytics and dashboards'),
      ('curator', 'rlhf_feedback', 'Can provide RLHF feedback on AI responses'),
      ('curator', 'view_analytics', 'Can view analytics and dashboards')
    ON CONFLICT (role, permission) DO NOTHING;
  `;
  
  return executeSQL('Inserting default permissions', sql);
}

async function insertDefaultUsers() {
  console.log(`\n📝 Inserting default admin users...`);
  
  const users = [
    { email: 'matt@mattcarpenter.com', role: 'admin' },
    { email: 'fiona@fionaburgess.com', role: 'admin' },
    { email: 'curator@example.com', role: 'curator' } // Test user
  ];
  
  for (const user of users) {
    const { error } = await supabase
      .from('user_roles')
      .upsert({
        email: user.email,
        role: user.role,
        organization: 'sony-music',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      });
    
    if (error) {
      console.log(`   ⚠️  ${user.email}: ${error.message}`);
    } else {
      console.log(`   ✅ ${user.email} → ${user.role}`);
    }
  }
  
  return true;
}

async function createRLHFFeedbackTable() {
  const sql = `
    -- Create rlhf_feedback table
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
    
    CREATE INDEX IF NOT EXISTS idx_rlhf_conversation ON rlhf_feedback(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_rlhf_user ON rlhf_feedback(user_email);
    CREATE INDEX IF NOT EXISTS idx_rlhf_created ON rlhf_feedback(created_at DESC);
  `;
  
  return executeSQL('Creating rlhf_feedback table', sql);
}

async function main() {
  console.log('🚀 RLHF Database Setup\n');
  console.log('=' .repeat(60));
  
  // Try to create tables
  await createUserRolesTable();
  await createRolePermissionsTable();
  await createRLHFFeedbackTable();
  await insertDefaultPermissions();
  await insertDefaultUsers();
  
  // Verify
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Verification:\n');
  
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('email, role')
    .order('email');
  
  if (!rolesError && roles) {
    console.log('✅ User Roles:');
    roles.forEach(r => console.log(`   - ${r.email}: ${r.role}`));
  }
  
  const { data: perms, error: permsError } = await supabase
    .from('role_permissions')
    .select('role, permission')
    .order('role, permission');
  
  if (!permsError && perms) {
    console.log('\n✅ Permissions:');
    const byRole = {};
    perms.forEach(p => {
      if (!byRole[p.role]) byRole[p.role] = [];
      byRole[p.role].push(p.permission);
    });
    Object.entries(byRole).forEach(([role, permissions]) => {
      console.log(`   ${role}: ${permissions.join(', ')}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ RLHF database setup complete!\n');
}

main().catch(console.error);

