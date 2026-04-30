import { afterEach, describe, expect, it, vi } from 'vitest';

const supabaseMock = vi.hoisted(() => {
  const single = vi.fn();
  const insertSelect = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select: insertSelect }));

  const limit = vi.fn();
  const order = vi.fn(() => ({ limit }));
  const eq = vi.fn(() => ({ order }));
  const selectForList = vi.fn(() => ({ eq }));

  const select = vi.fn((...args: unknown[]) => {
    select.mock.calls.push(args);
    return { eq };
  });

  const from = vi.fn(() => ({
    insert,
    select,
  }));

  return {
    supabase: { from },
    insert,
    insertSelect,
    single,
    select,
    selectForList,
    eq,
    order,
    limit,
  };
});

vi.mock('./supabaseClient', () => ({
  supabase: supabaseMock.supabase,
}));

import { insertGame, isStarGame, listRecentGames } from './games';

const COLUMNS = 'id, user_id, played_at, ruleset, score, rank, genre, memo, created_at';

afterEach(() => {
  vi.clearAllMocks();
});

describe('insertGame', () => {
  it('inserts a row with snake_case columns and returns a camelCase record', async () => {
    supabaseMock.single.mockResolvedValueOnce({
      data: {
        id: 'game-1',
        user_id: 'user-1',
        played_at: '2026-04-30T12:00:00Z',
        ruleset: '4ma',
        score: 32500,
        rank: 2,
        genre: 'free_5',
        memo: 'good run',
        created_at: '2026-04-30T12:00:01Z',
      },
      error: null,
    });

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
    expect(supabaseMock.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      played_at: '2026-04-30T12:00:00Z',
      ruleset: '4ma',
      score: 32500,
      rank: 2,
      genre: 'free_5',
      memo: 'good run',
    });
    expect(supabaseMock.insertSelect).toHaveBeenCalledWith(COLUMNS);
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
    supabaseMock.single.mockResolvedValueOnce({
      data: {
        id: 'game-2',
        user_id: 'user-1',
        played_at: '2026-04-30T12:00:00Z',
        ruleset: '3ma',
        score: 70000,
        rank: 1,
        genre: 'friend',
        memo: null,
        created_at: '2026-04-30T12:00:01Z',
      },
      error: null,
    });

    await insertGame({
      userId: 'user-1',
      playedAt: '2026-04-30T12:00:00Z',
      ruleset: '3ma',
      score: 70000,
      rank: 1,
      genre: 'friend',
    });

    expect(supabaseMock.insert).toHaveBeenCalledWith(
      expect.objectContaining({ memo: null }),
    );
  });

  it('throws when supabase returns an error', async () => {
    supabaseMock.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'permission denied' },
    });

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
  it('selects own rows ordered by played_at desc with limit', async () => {
    supabaseMock.limit.mockResolvedValueOnce({
      data: [
        {
          id: 'game-3',
          user_id: 'user-1',
          played_at: '2026-04-30T12:00:00Z',
          ruleset: '4ma',
          score: 60000,
          rank: 1,
          genre: 'friend',
          memo: null,
          created_at: '2026-04-30T12:00:01Z',
        },
      ],
      error: null,
    });

    const records = await listRecentGames('user-1', 30);

    expect(supabaseMock.supabase.from).toHaveBeenCalledWith('games');
    expect(supabaseMock.select).toHaveBeenCalledWith(COLUMNS);
    expect(supabaseMock.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabaseMock.order).toHaveBeenCalledWith('played_at', { ascending: false });
    expect(supabaseMock.limit).toHaveBeenCalledWith(30);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ id: 'game-3', userId: 'user-1', score: 60000 });
  });

  it('defaults limit to 30', async () => {
    supabaseMock.limit.mockResolvedValueOnce({ data: [], error: null });

    await listRecentGames('user-1');

    expect(supabaseMock.limit).toHaveBeenCalledWith(30);
  });

  it('returns empty array when data is null', async () => {
    supabaseMock.limit.mockResolvedValueOnce({ data: null, error: null });

    const records = await listRecentGames('user-1');

    expect(records).toEqual([]);
  });
});
