// =============================================================================
// FILE: src/lib/supabaseAdmin.ts
// LAYER: Core / Network (SERVER ONLY)
//
// PURPOSE:
//   Creates a Supabase client with the service_role key.
//   This bypasses Row Level Security entirely and can create/delete Auth users.
//
// ⚠️  CRITICAL SECURITY NOTE:
//   This file must ONLY be imported in:
//     - /app/api/**  (Next.js server-side API routes)
//   NEVER import this in any 'use client' component or the browser bundle.
//   The service_role key grants full admin access to your entire database.
//
// USAGE:
//   const adminClient = createSupabaseAdminClient();
//   await adminClient.auth.admin.createUser({ email, password });
// =============================================================================

import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client using the service_role key.
 * Server-side only — never call this in browser code.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      '[supabaseAdmin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Check your .env.local file.'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      // Disable auto session refresh — this is a server-side admin client,
      // it does not need persistent sessions or token refresh.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
