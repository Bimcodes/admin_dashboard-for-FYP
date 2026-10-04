// =============================================================================
// FILE: src/lib/supabaseClient.ts
// LAYER: Core / Network
//
// PURPOSE:
//   Creates and exports a browser-side Supabase client for use in
//   Client Components ('use client'). Uses @supabase/ssr which handles
//   cookie-based session persistence correctly in Next.js.
//
// USAGE:
//   import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
//   const supabase = createSupabaseBrowserClient();
//   await supabase.auth.signInWithPassword({ email, password });
// =============================================================================

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser/client components.
 * This is safe to call multiple times — @supabase/ssr handles singleton internally.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
