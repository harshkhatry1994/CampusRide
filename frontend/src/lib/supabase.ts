import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl);
console.log("KEY:", supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables! Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
}

if (supabaseAnonKey === 'your_publishable_key') {
  console.error(
    "❌ VITE_SUPABASE_ANON_KEY is still set to the placeholder 'your_publishable_key'.\n" +
    "   Go to https://supabase.com/dashboard → Project Settings → API → anon/public key\n" +
    "   and paste the real key into frontend/.env as VITE_SUPABASE_ANON_KEY=eyJ..."
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,   // ← critical: lets Supabase auto-exchange the ?code= on /auth/callback
    flowType: 'pkce',           // ← Google OAuth uses PKCE flow
  },
});
