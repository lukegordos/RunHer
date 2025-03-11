
import { createClient } from '@supabase/supabase-js';

// Always make sure to use environment variables for these values in a real app
// These will need to be replaced with actual values from your Supabase project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
