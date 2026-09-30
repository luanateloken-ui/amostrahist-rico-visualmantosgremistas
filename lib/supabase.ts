import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase exclusivamente do servidor.
 * Nenhuma chave NEXT_PUBLIC é necessária ou utilizada.
 *
 * Preferência: SUPABASE_SECRET_KEY (sb_secret_...).
 * Compatibilidade: SUPABASE_SERVICE_ROLE_KEY (JWT legado).
 */
export function getServerSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export const getAdminSupabase = getServerSupabase;
