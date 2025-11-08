/**
 * Setup RLHF Database - API Route
 * POST /api/setup-rlhf
 * 
 * Applies RLHF migrations by reading SQL files and executing via Supabase service role.
 * This works around the limitation of not being able to execute arbitrary SQL via the JS client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Check if tables already exist
    const { data: existing, error: checkError } = await supabase
      .from('user_roles')
      .select('count')
      .limit(1);

    if (!checkError && existing !== null) {
      // Tables exist!
      const { data: roles } = await supabase.from('user_roles').select('email, role');
      const { data: perms } = await supabase.from('role_permissions').select('role, permission');

      return NextResponse.json({
        success: true,
        message: 'RLHF tables already exist!',
        stats: {
          user_roles: roles?.length || 0,
          role_permissions: perms?.length || 0,
        },
        users: roles || [],
      });
    }

    // Tables don't exist - need manual migration
    return NextResponse.json({
      success: false,
      message: 'Tables need to be created',
      instructions: {
        step1: 'Go to Supabase SQL Editor',
        step2: 'Run migrations: 006, 007, 008',
        sql_editor_url: `https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql`,
      },
      migrations: [
        'supabase/migrations/006_user_roles_permissions.sql',
        'supabase/migrations/007_rlhf_feedback_schema.sql',
        'supabase/migrations/008_gemini_embeddings.sql',
      ],
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // Check status
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ status: 'not_configured' });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('email, role');

    if (error) {
      return NextResponse.json({
        status: 'tables_missing',
        message: 'RLHF tables not created yet',
        error: error.message,
      });
    }

    return NextResponse.json({
      status: 'ready',
      message: 'RLHF system is configured!',
      users: roles || [],
      admins: roles?.filter(r => r.role === 'admin' || r.role === 'curator') || [],
    });

  } catch (error: any) {
    return NextResponse.json({ status: 'error', error: error.message });
  }
}

