import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

const OAUTH_ERROR_PARAMS = ['error', 'error_code', 'error_description'];

/** The signed-in user: undefined while the session is being restored, null when signed out. */
export function useSession() {
  const [user, setUser] = useState<User | null | undefined>(supabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return;
    // supabase-js removes ?code= after a successful sign-in; a cancelled one leaves an error behind.
    const url = new URL(location.href);
    const message = url.searchParams.get('error_description');
    if (message) {
      OAUTH_ERROR_PARAMS.forEach((name) => url.searchParams.delete(name));
      history.replaceState(history.state, '', url);
      alert(`Couldn't sign in: ${message}`);
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  return user;
}
