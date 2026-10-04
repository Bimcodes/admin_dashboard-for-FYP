import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: 'Unauthorized' };

  const { data: row } = await supabase
    .from('users').select('role').eq('id', user.id).single();
  
  if (row?.role !== 'Admin') return { ok: false as const, status: 403, error: 'Forbidden' };

  return { ok: true as const, user };
}
