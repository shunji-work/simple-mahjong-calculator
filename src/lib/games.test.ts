import { afterEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => {
  type Result = { data: unknown; error: unknown; count?: number | null };
  let result: Result = { data: null, error: null };

  // PostgREST のクエリビルダーを模したチェーン可能なモック。
  // 末尾で await されると（then）、setResult で設定した結果を返す。
  const builder = {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  for (const key of ['insert', 'update', 'delete', 'select', 'eq', 'in', 'order', 'limit'] as const) {
    builder[key].mockImplementation(() => builder);
  }

  const from = vi.fn(() => builder);

  return {
    supabase: { from },
    builder,
    setResult(next: Result) {
      result = next;
    },
    reset() {
      result = { data: null, error: null };
    },
  };
});

vi.mock('./supabaseClient', () => ({
  supabase: supabaseMock.supabase,
  isSupabaseConfigured: true,
  requireSupabase: () => supabaseMock.supabase,
}));

import { UserFacingError } from './errorMessage';
import {
  GAME_COLUMNS,
  deleteGame,
  insertGame,
  isStarGame,
  listRecentGames,
  matchesGameFilter,
  updateGame,
} from './games';

const { builder } = supabaseMock;

const ROW = {
  id: 'game-1',
  user_id: 'user-1',
  played_at: '2026-04-30T12:00:00Z',
  ruleset: '4ma',
  score: 32500,
  rank: 2,
  genre: 'free_5',
  memo: 'good run',
  created_at: '2026-04-30T12:00:01Z',
};

afterEach(() => {
  vi.clearAllMocks();
  supabaseMock.reset();
});

describe('GAME_COLUMNS', () => {
  it('lists the snake_case columns of the games table', () => {
    expect(GAME_COLUMNS).toBe(
      'id, user_id, played_at, ruleset, score, rank, genre, memo, created_at',
    );
  });
});

describe('insertGame', () => {
  it('inserts a row with snake_case columns and returns a camelCase record', async () => {
    supabaseMock.setResult({ data: ROW, error: null });

    const record = await insertGame({
      userId: 'user-1',
      playedAt: '2026-04-30T12:00:00Z',
      ruleset: '4ma',
      score: 32500,
      rank: 2,
      genre: 'free_5',
      memo: 'good run',
    });

    expect(supabaseMock.supabase.from).toHaveBeenCalledWith('games');
    expect(builder.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      played_at: '2026-04-30T12:00:00Z',
      ruleset: '4ma',
      score: 32500,
      rank: 2,
      genre: 'free_5',
      memo: 'good run',
    });
    expect(builder.select).toHaveBeenCalledWith(GAME_COLUMNS);
    expect(builder.single).toHaveBeenCalledTimes(1);
    expect(record).toEqual({
      id: 'game-1',
      userId: 'user-1',
      playedAt: '2026-04-30T12:00:00Z',
      ruleset: '4ma',
      score: 32500,
      rank: 2,
      genre: 'free_5',
      memo: 'good run',
      createdAt: '2026-04-30T12:00:01Z',
    });
  });

  it('coerces missing memo to null', async () => {
    supabaseMock.setResult({ data: { ...ROW, memo: null }, error: null });

    await insertGame({
      userId: 'user-1',
      playedAt: '2026-04-30T12:00:00Z',
      ruleset: '3ma',
      score: 70000,
      rank: 1,
      genre: 'friend',
    });

    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ memo: null }));
  });

  it('throws when supabase returns an error', async () => {
    supabaseMock.setResult({ data: null, error: { message: 'permission denied' } });

    await expect(
      insertGame({
        userId: 'user-1',
        playedAt: '2026-04-30T12:00:00Z',
        ruleset: '4ma',
        score: 25000,
        rank: 3,
        genre: 'free_1',
      }),
    ).rejects.toMatchObject({ message: 'permission denied' });
  });
});

describe('updateGame', () => {
  const input = {
    id: 'game-1',
    userId: 'user-1',
    playedAt: '2026-04-30T13:00:00Z',
    ruleset: '4ma' as const,
    score: 41000,
    rank: 1,
    genre: 'free_1' as const,
    memo: 'edited',
  };

  it('updates own row by id with snake_case columns and returns camelCase record', async () => {
    supabaseMock.setResult({
      data: { ...ROW, played_at: input.playedAt, score: 41000, rank: 1, genre: 'free_1', memo: 'edited' },
      error: null,
    });

    const record = await updateGame(input);

    expect(supabaseMock.supabase.from).toHaveBeenCalledWith('games');
    expect(builder.update).toHaveBeenCalledWith({
      played_at: '2026-04-30T13:00:00Z',
      ruleset: '4ma',
      score: 41000,
      rank: 1,
      genre: 'free_1',
      memo: 'edited',
    });
    expect(builder.eq).toHaveBeenCalledWith('id', 'game-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.select).toHaveBeenCalledWith(GAME_COLUMNS);
    expect(record.id).toBe('game-1');
    expect(record.score).toBe(41000);
  });

  it('throws when supabase returns an error', async () => {
    supabaseMock.setResult({ data: null, error: { message: 'permission denied' } });

    await expect(updateGame(input)).rejects.toMatchObject({ message: 'permission denied' });
  });

  it('turns a 0-row update (PGRST116) into a user-facing error', async () => {
    supabaseMock.setResult({
      data: null,
      error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
    });

    const promise = updateGame(input);
    await expect(promise).rejects.toBeInstanceOf(UserFacingError);
    await expect(promise).rejects.toThrow('更新対象の記録が見つかりませんでした');
  });
});

describe('deleteGame', () => {
  it('deletes own row by id and asks for the deleted ids back', async () => {
    supabaseMock.setResult({ data: [{ id: 'game-1' }], error: null });

    await deleteGame('game-1', 'user-1');

    expect(supabaseMock.supabase.from).toHaveBeenCalledWith('games');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'game-1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.select).toHaveBeenCalledWith('id');
  });

  it('throws a user-facing error when no row was deleted (e.g. filtered by RLS)', async () => {
    supabaseMock.setResult({ data: [], error: null });

    const promise = deleteGame('game-1', 'user-1');
    await expect(promise).rejects.toBeInstanceOf(UserFacingError);
    await expect(promise).rejects.toThrow('記録を削除できませんでした');
  });

  it('throws when supabase returns an error', async () => {
    supabaseMock.setResult({ data: null, error: { message: 'permission denied' } });

    await expect(deleteGame('game-1', 'user-1')).rejects.toMatchObject({
      message: 'permission denied',
    });
  });
});

describe('isStarGame', () => {
  it('returns true for 4ma top with score >= 50000', () => {
    expect(isStarGame({ ruleset: '4ma', rank: 1, score: 50000 })).toBe(true);
    expect(isStarGame({ ruleset: '4ma', rank: 1, score: 62300 })).toBe(true);
  });

  it('returns false for 4ma top below 50000', () => {
    expect(isStarGame({ ruleset: '4ma', rank: 1, score: 49900 })).toBe(false);
    expect(isStarGame({ ruleset: '4ma', rank: 1, score: 32000 })).toBe(false);
  });

  it('returns true for 3ma top with score >= 70000', () => {
    expect(isStarGame({ ruleset: '3ma', rank: 1, score: 70000 })).toBe(true);
    expect(isStarGame({ ruleset: '3ma', rank: 1, score: 90000 })).toBe(true);
  });

  it('returns false for 3ma top below 70000', () => {
    expect(isStarGame({ ruleset: '3ma', rank: 1, score: 69900 })).toBe(false);
  });

  it('returns false when rank is not 1', () => {
    expect(isStarGame({ ruleset: '4ma', rank: 2, score: 60000 })).toBe(false);
    expect(isStarGame({ ruleset: '3ma', rank: 2, score: 80000 })).toBe(false);
  });
});

describe('listRecentGames', () => {
  it('selects own rows with exact count, ordered by played_at desc with limit', async () => {
    supabaseMock.setResult({
      data: [{ ...ROW, id: 'game-3', score: 60000, rank: 1, genre: 'friend', memo: null }],
      error: null,
      count: 42,
    });

    const result = await listRecentGames('user-1', { limit: 30 });

    expect(supabaseMock.supabase.from).toHaveBeenCalledWith('games');
    expect(builder.select).toHaveBeenCalledWith(GAME_COLUMNS, { count: 'exact' });
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(builder.eq).toHaveBeenCalledTimes(1);
    expect(builder.in).not.toHaveBeenCalled();
    expect(builder.order).toHaveBeenCalledWith('played_at', { ascending: false });
    expect(builder.limit).toHaveBeenCalledWith(30);
    expect(result.total).toBe(42);
    expect(result.games).toHaveLength(1);
    expect(result.games[0]).toMatchObject({ id: 'game-3', userId: 'user-1', score: 60000 });
  });

  it('filters by ruleset and a single genre on the server', async () => {
    supabaseMock.setResult({ data: [], error: null, count: 0 });

    await listRecentGames('user-1', { ruleset: '3ma', genre: 'friend' });

    expect(builder.eq).toHaveBeenCalledWith('ruleset', '3ma');
    expect(builder.eq).toHaveBeenCalledWith('genre', 'friend');
  });

  it('expands free_total into free_5 and free_1', async () => {
    supabaseMock.setResult({ data: [], error: null, count: 0 });

    await listRecentGames('user-1', { ruleset: '4ma', genre: 'free_total' });

    expect(builder.in).toHaveBeenCalledWith('genre', ['free_5', 'free_1']);
    expect(builder.eq).not.toHaveBeenCalledWith('genre', expect.anything());
  });

  it('defaults limit to 30', async () => {
    supabaseMock.setResult({ data: [], error: null, count: 0 });

    await listRecentGames('user-1');

    expect(builder.limit).toHaveBeenCalledWith(30);
  });

  it('returns empty array when data is null', async () => {
    supabaseMock.setResult({ data: null, error: null, count: null });

    const result = await listRecentGames('user-1');

    expect(result).toEqual({ games: [], total: 0 });
  });

  it('throws when supabase returns an error', async () => {
    supabaseMock.setResult({ data: null, error: { message: 'boom' } });

    await expect(listRecentGames('user-1')).rejects.toMatchObject({ message: 'boom' });
  });
});

describe('matchesGameFilter', () => {
  it('matches by ruleset and genre, treating free_total as free_5 + free_1', () => {
    const g = { ruleset: '4ma' as const, genre: 'free_1' as const };
    expect(matchesGameFilter(g, {})).toBe(true);
    expect(matchesGameFilter(g, { ruleset: '4ma' })).toBe(true);
    expect(matchesGameFilter(g, { ruleset: '3ma' })).toBe(false);
    expect(matchesGameFilter(g, { ruleset: '4ma', genre: 'free_total' })).toBe(true);
    expect(matchesGameFilter(g, { ruleset: '4ma', genre: 'free_1' })).toBe(true);
    expect(matchesGameFilter(g, { ruleset: '4ma', genre: 'friend' })).toBe(false);
  });
});
