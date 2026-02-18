import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        '[Supabase] CRITICAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing!',
        'Auth, trips, and all DB features will be broken.',
        { url: supabaseUrl ? 'set' : 'MISSING', key: supabaseAnonKey ? 'set' : 'MISSING' }
    );
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

