import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Supabase が設定されておりログイン・記録機能が使えるか */
  available: boolean;
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: (captchaToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
