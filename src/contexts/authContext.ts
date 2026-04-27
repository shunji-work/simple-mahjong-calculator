import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
