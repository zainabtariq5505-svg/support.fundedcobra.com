import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Helper: verify the caller is an admin
async function getCallerRole() {
  const sb = await createServerClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role ?? null;
}

// GET /api/team — list all staff members
export async function GET() {
  const role = await getCallerRole();
  if (!role || !['admin', 'support_agent', 'finance', 'partnership_manager'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = await createServerClient();
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'support_agent', 'finance', 'partnership_manager'])
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}

// POST /api/team — create a new staff member (admin only)
export async function POST(req: NextRequest) {
  const role = await getCallerRole();
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can create staff members' }, { status: 403 });
  }

  const body = await req.json();
  const { full_name, email, password, staff_role } = body;

  if (!full_name?.trim() || !email?.trim() || !password?.trim() || !staff_role) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const validRoles = ['support_agent', 'finance', 'partnership_manager', 'admin'];
  if (!validRoles.includes(staff_role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Use Supabase admin client (service role) to create the auth user
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create the auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password: password.trim(),
    email_confirm: true, // auto-confirm so they can login immediately
    user_metadata: {
      full_name: full_name.trim(),
      role: staff_role,
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Upsert the profile with the correct role
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id:        authData.user.id,
      full_name: full_name.trim(),
      email:     email.trim(),
      role:      staff_role,
    }, { onConflict: 'id' });

  if (profileError) {
    // Cleanup: delete the auth user if profile failed
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    member: {
      id:         authData.user.id,
      full_name:  full_name.trim(),
      email:      email.trim(),
      role:       staff_role,
      created_at: authData.user.created_at,
    },
  });
}

// PATCH /api/team — update a staff member's role or name
export async function PATCH(req: NextRequest) {
  const role = await getCallerRole();
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can update staff members' }, { status: 403 });
  }

  const body = await req.json();
  const { id, full_name, staff_role } = body;

  if (!id) return NextResponse.json({ error: 'Member ID required' }, { status: 400 });

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const updates: Record<string, string> = {};
  if (full_name?.trim()) updates.full_name = full_name.trim();
  if (staff_role) updates.role = staff_role;

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/team — remove a staff member (admin only)
export async function DELETE(req: NextRequest) {
  const role = await getCallerRole();
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can remove staff members' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Member ID required' }, { status: 400 });

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Delete auth user (cascades to profile via DB trigger)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
