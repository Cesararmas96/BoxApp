import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials are missing. Please add them to your .env file.');
} else {
    console.log('[Supabase] Client initialized with URL:', supabaseUrl);
    console.log('[Supabase] Anon key prefix:', supabaseAnonKey.substring(0, 10), '...');
}

export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '');
