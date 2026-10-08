import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { UserFacingError } from './errorMessage';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase の環境変数が設定されているか。
 * 未設定でも点数計算機能は使えるよう、import 時には例外を投げない。
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    'Supabase の環境変数が未設定です。プロジェクト直下の .env.local に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。記録・ログイン機能は無効になります。',
  );
}

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

/** Supabase クライアントを取得する。未設定の場合はユーザー向けのエラーを投げる。 */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new UserFacingError('記録機能は現在利用できません。');
  }
  return supabase;
}
