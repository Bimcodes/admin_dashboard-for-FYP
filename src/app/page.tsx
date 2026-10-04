'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '../lib/supabaseClient';

/**
 * Root page - checks for a live Supabase session.
 * Redirects to /dashboard if authenticated, or /login if not.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-400 text-sm font-semibold tracking-wide">Loading Secure Portal...</span>
      </div>
    </div>
  );
}
