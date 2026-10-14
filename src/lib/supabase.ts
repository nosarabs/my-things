import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Null when the build has no Supabase config, which keeps the app local-only. */
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null;

export async function signIn() {
  const result = await supabase?.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: location.origin + location.pathname },
  });
  if (result?.error) alert(`Couldn't sign in: ${result.error.message}`);
}

export async function signOut() {
  await supabase?.auth.signOut();
}
