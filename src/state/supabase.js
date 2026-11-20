import { createClient } from '@supabase/supabase-js';

// The connection to our Supabase project (accounts + cloud saves).
//
// The address and public key come from a file called .env (copy
// .env.example and fill it in). Vite only shares env values whose
// names start with VITE_ with the browser.
//
// The "anon" key is meant to be public: it's safe in the browser because
// the database rules in supabase/schema.sql decide what anyone can do.
// (Never put the "service_role" key in here!)
//
// No .env? Then `supabase` is null and the game runs in offline
// "guest" mode: no login screen, saves stay in this browser only.

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const isOnline = Boolean(supabase);

if (!isOnline) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing, so My Cozy Market is in offline guest mode ' +
      '(no login, saves stay in this browser). See .env.example.',
  );
}
