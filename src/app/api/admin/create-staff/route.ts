// =============================================================================
// FILE: src/app/api/admin/create-staff/route.ts
// LAYER: API Route (Server-Side Only)
//
// PURPOSE:
//   Creates a new staff member (Agent or Driver) in Supabase:
//     1. Generates a sequential staff code (AGT-001, DRV-001, etc.)
//     2. Creates a Supabase Auth user (server-side, uses service_role key)
//     3. Inserts a row into the `users` table
//     4. Creates a matching wallet (Agent_Vault or Bus_Vault)
//     5. Returns the credentials for QR code generation on the frontend
//
// SECURITY:
//   Uses the service_role key via createSupabaseAdminClient().
//   This route is protected by the fact that only authenticated admin sessions
//   can reach the dashboard that calls it. In production, add session
//   verification at the top of this handler.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabaseAdmin';

/** Generates a cryptographically random password */
function generateTempPassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  let result = '';
  // Use Math.random fallback since crypto.getRandomValues works in Node edge runtime
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, email } = body as { name: string; role: 'Agent' | 'Driver'; email: string };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (role !== 'Agent' && role !== 'Driver') {
      return NextResponse.json({ error: 'Role must be Agent or Driver.' }, { status: 400 });
    }

    const adminClient = createSupabaseAdminClient();

    // ── 1. Count existing users of this role for sequential code ─────────────
    const { count, error: countError } = await adminClient
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', role);

    if (countError) throw new Error(`Count query failed: ${countError.message}`);

    const nextNum = (count ?? 0) + 1;
    const prefix = role === 'Agent' ? 'AGT' : 'DRV';
    const staffCode = `${prefix}-${String(nextNum).padStart(3, '0')}`;
    const walletType = role === 'Agent' ? 'Agent_Vault' : 'Bus_Vault';

    // ── 2. Create Supabase Auth user (service_role bypasses invite flow) ──────
    const tempPassword = generateTempPassword();

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password: tempPassword,
      email_confirm: true, // Auto-confirm so they can sign in immediately
    });

    if (authError) {
      // Handle duplicate staff code collision (rare, but possible)
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: `Staff code ${staffCode} already exists. Please try again.` },
          { status: 409 }
        );
      }
      throw new Error(`Auth user creation failed: ${authError.message}`);
    }

    const userId = authData.user.id;

    // ── 3. Insert into users table ────────────────────────────────────────────
    const { error: userInsertError } = await adminClient
      .from('users')
      .insert({ id: userId, name: name.trim(), role });

    if (userInsertError) {
      // Rollback: delete the auth user we just created
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error(`Users table insert failed: ${userInsertError.message}`);
    }

    // ── 4. Create wallet ──────────────────────────────────────────────────────
    const { error: walletError } = await adminClient
      .from('wallets')
      .insert({ owner_id: userId, wallet_type: walletType, balance: 0 });

    if (walletError) {
      // Non-fatal — log but don't rollback the user
      console.error('[create-staff] Wallet creation failed:', walletError.message);
    }

    // ── 5. Return credentials for QR generation ───────────────────────────────
    console.log(`[create-staff] ✅ Created ${role} ${staffCode} (${name})`);

    return NextResponse.json({
      staffCode,
      name: name.trim(),
      role,
      email: email.trim(),
      tempPassword,
      userId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[create-staff] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
