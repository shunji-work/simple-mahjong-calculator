import { supabase } from './supabaseClient';
import type { GameRecord, NewGameInput } from '../types/game';

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
  const { data, error } = await supabase
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
    .select(
      'id, user_id, played_at, ruleset, score, rank, genre, memo, created_at',
    )
    .single();

  if (error) throw error;
  if (!data) throw new Error('対局の保存に失敗しました');
  return rowToRecord(data as GameRow);
}

export interface UpdateGameInput {
  id: string;
  playedAt: string;
  ruleset: NewGameInput['ruleset'];
  score: number;
  rank: number;
  genre: NewGameInput['genre'];
  memo?: string | null;
}

export async function updateGame(input: UpdateGameInput): Promise<GameRecord> {
  const { data, error } = await supabase
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
    .select(
      'id, user_id, played_at, ruleset, score, rank, genre, memo, created_at',
    )
    .single();

  if (error) throw error;
  if (!data) throw new Error('対局の更新に失敗しました');
  return rowToRecord(data as GameRow);
}

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw error;
}

/**
 * トップ（1位）かつ高得点を達成した対局を判定する。
 * 4麻: 50000点以上、3麻: 70000点以上のトップ。
 * グラフ上で★マークを表示する条件として使う。
 */
export function isStarGame(game: Pick<GameRecord, 'rank' | 'score' | 'ruleset'>): boolean {
  if (game.rank !== 1) return false;
  const threshold = game.ruleset === '4ma' ? 50000 : 70000;
  return game.score >= threshold;
}

export async function listRecentGames(
  userId: string,
  limit = 30,
): Promise<GameRecord[]> {
  const { data, error } = await supabase
    .from('games')
    .select(
      'id, user_id, played_at, ruleset, score, rank, genre, memo, created_at',
    )
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => rowToRecord(row as GameRow));
}
