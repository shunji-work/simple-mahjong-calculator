import { ReactNode, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, requireSupabase, supabase } from '../lib/supabaseClient';
import { AuthContext, type AuthContextValue } from './authContext';

const SESSION_CHECK_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('認証サーバーの確認がタイムアウトしました'));
    }, timeoutMs);

    promise
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Supabase 未設定時は確認するセッションが無いので即座に loading=false
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    withTimeout(supabase.auth.getSession(), SESSION_CHECK_TIMEOUT_MS)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('Auth session initialization failed:', error);
          setSession(null);
          return;
        }
        setSession(data.session);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('Auth session initialization failed:', error);
        setSession(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    return {
      session,
      user,
      loading,
      available: isSupabaseConfigured,
      isAnonymous: user?.is_anonymous === true,
      signInWithGoogle: async () => {
        const { error } = await requireSupabase().auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
      },
      signInAnonymously: async (captchaToken?: string) => {
        const { error } = await requireSupabase().auth.signInAnonymously(
          captchaToken ? { options: { captchaToken } } : undefined,
        );
        if (error) throw error;
      },
      signOut: async () => {
        const { error } = await requireSupabase().auth.signOut();
        if (error) throw error;
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
