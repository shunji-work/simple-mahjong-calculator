import { requireSupabase } from './supabaseClient';
import { UserFacingError } from './errorMessage';
import {
  STAR_THRESHOLD,
  type FilterGenre,
  type GameRecord,
  type NewGameInput,
  type Ruleset,
  type StoredGenre,
} from '../types/game';

/** games テーブルから取得するカラム（select の単一の定義元） */
export const GAME_COLUMNS =
  'id, user_id, played_at, ruleset, score, rank, genre, memo, created_at';

interface GameRow {
  id: string;
  user_id: string;
  played_at: string;
  ruleset: GameRecord['ruleset'];
  score: number;
  rank: number;
  genre: GameRecord['genre'];
  memo: string | null;
  created_at: string;
}

function rowToRecord(row: GameRow): GameRecord {
  return {
    id: row.id,
    userId: row.user_id,
    playedAt: row.played_at,
    ruleset: row.ruleset,
    score: row.score,
    rank: row.rank,
    genre: row.genre,
    memo: row.memo,
    createdAt: row.created_at,
  };
}

export async function insertGame(input: NewGameInput): Promise<GameRecord> {
  const { data, error } = await requireSupabase()
    .from('games')
    .insert({
      user_id: input.userId,
      played_at: input.playedAt,
      ruleset: input.ruleset,
      score: input.score,
      rank: input.rank,
      genre: input.genre,
      memo: input.memo ?? null,
    })
    .select(GAME_COLUMNS)
    .single();

  if (error) throw error;
  if (!data) throw new UserFacingError('対局の保存に失敗しました。');
  return rowToRecord(data as GameRow);
}

export interface UpdateGameInput {
  id: string;
  /** 多層防御として、本人の行のみを対象にするための user_id */
  userId: string;
  playedAt: string;
  ruleset: NewGameInput['ruleset'];
  score: number;
  rank: number;
  genre: NewGameInput['genre'];
  memo?: string | null;
}

export async function updateGame(input: UpdateGameInput): Promise<GameRecord> {
  const { data, error } = await requireSupabase()
    .from('games')
    .update({
      played_at: input.playedAt,
      ruleset: input.ruleset,
      score: input.score,
      rank: input.rank,
      genre: input.genre,
      memo: input.memo ?? null,
    })
    .eq('id', input.id)
    .eq('user_id', input.userId)
    .select(GAME_COLUMNS)
    .single();

  if (error) {
    // 0 行更新（削除済み or RLS で対象外）の場合は .single() が PGRST116 を返す
    if (error.code === 'PGRST116') {
      throw new UserFacingError(
        '更新対象の記録が見つかりませんでした。すでに削除されている可能性があります。',
      );
    }
    throw error;
  }
  if (!data) throw new UserFacingError('対局の更新に失敗しました。');
  return rowToRecord(data as GameRow);
}

export async function deleteGame(id: string, userId: string): Promise<void> {
  // RLS で弾かれた削除はエラーにならず 0 行になるため、削除された行を返して確認する
  const { data, error } = await requireSupabase()
    .from('games')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new UserFacingError(
      '記録を削除できませんでした。すでに削除されているか、削除する権限がありません。',
    );
  }
}

/**
 * トップ（1位）かつ高得点を達成した対局を判定する。
 * 閾値は STAR_THRESHOLD（4麻: 50000点、3麻: 70000点）。
 * グラフ上で★マークを表示する条件として使う。
 */
export function isStarGame(game: Pick<GameRecord, 'rank' | 'score' | 'ruleset'>): boolean {
  if (game.rank !== 1) return false;
  return game.score >= STAR_THRESHOLD[game.ruleset];
}

const FREE_TOTAL_GENRES: ReadonlyArray<StoredGenre> = ['free_5', 'free_1'];

export interface ListGamesOptions {
  ruleset?: Ruleset;
  /** 未指定ならすべてのジャンル */
  genre?: FilterGenre;
  limit?: number;
}

export interface ListGamesResult {
  /** played_at 降順の直近 limit 件 */
  games: GameRecord[];
  /** フィルタ条件に一致する全件数 */
  total: number;
}

/** 記録がフィルタ条件に一致するか（ローカル更新時の判定用） */
export function matchesGameFilter(
  game: Pick<GameRecord, 'ruleset' | 'genre'>,
  { ruleset, genre }: Pick<ListGamesOptions, 'ruleset' | 'genre'>,
): boolean {
  if (ruleset && game.ruleset !== ruleset) return false;
  if (!genre) return true;
  if (genre === 'free_total') return FREE_TOTAL_GENRES.includes(game.genre);
  return game.genre === genre;
}

export async function listRecentGames(
  userId: string,
  { ruleset, genre, limit = 30 }: ListGamesOptions = {},
): Promise<ListGamesResult> {
  let query = requireSupabase()
    .from('games')
    .select(GAME_COLUMNS, { count: 'exact' })
    .eq('user_id', userId);

  if (ruleset) {
    query = query.eq('ruleset', ruleset);
  }
  if (genre === 'free_total') {
    query = query.in('genre', FREE_TOTAL_GENRES);
  } else if (genre) {
    query = query.eq('genre', genre);
  }

  const { data, error, count } = await query
    .order('played_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const games = (data ?? []).map((row) => rowToRecord(row as GameRow));
  return { games, total: count ?? games.length };
}
