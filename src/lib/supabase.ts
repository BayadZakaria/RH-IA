import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean up the URL if user forgot https://
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

export const isSupabaseConfigured = Boolean(supabaseUrl) && supabaseUrl !== 'https://xxxxxxxxxxxx.supabase.co';

if (!isSupabaseConfigured) {
  console.warn('⚠️ Variables Supabase introuvables ou invalides. Mode local activé.');
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://dummy.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'dummy-key',
  {
    auth: {
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured
    }
  }
);
