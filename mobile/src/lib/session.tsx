import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase, configurationError } from './supabase';
import { signInWithGoogle, signOut as supabaseSignOut } from './auth';

type SessionContextValue = {
  user: User | null;
  session: Session | null;
  /** True until the stored session has been read back from the device. */
  loading: boolean;
  signIn: (next?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // With no Supabase values there is no session to wait for, so this starts false
  // rather than being flipped from inside the effect below.
  const [loading, setLoading] = useState(!configurationError);

  useEffect(() => {
    if (configurationError) return;

    const supabase = getSupabase();
    let active = true;

    // Reading the stored session is what keeps a customer signed in after the
    // app is closed, so this has to finish before any screen trusts `user`.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session ?? null);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Supabase only refreshes the token on a timer while the app is in the
  // foreground, so it is told when the app comes back or goes away.
  useEffect(() => {
    if (configurationError) return;
    const supabase = getSupabase();
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const signIn = useCallback(async (next?: string) => {
    const result = await signInWithGoogle(next);
    return result.error;
  }, []);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    setSession(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signIn,
      signOut,
    }),
    [session, loading, signIn, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}