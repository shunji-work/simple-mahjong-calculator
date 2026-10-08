export type Ruleset = '4ma' | '3ma';

export type StoredGenre = 'free_5' | 'free_1' | 'friend';
export type FilterGenre = StoredGenre | 'free_total';

export interface GameRecord {
  id: string;
  userId: string;
  playedAt: string;
  ruleset: Ruleset;
  score: number;
  rank: number;
  genre: StoredGenre;
  memo: string | null;
  createdAt: string;
}

export interface NewGameInput {
  userId: string;
  playedAt: string;
  ruleset: Ruleset;
  score: number;
  rank: number;
  genre: StoredGenre;
  memo?: string | null;
}

export const RULESETS: ReadonlyArray<Ruleset> = ['4ma', '3ma'];

const RULESET_LONG_LABEL: Record<Ruleset, string> = {
  '4ma': '4麻（四人麻雀）',
  '3ma': '3麻（三人麻雀）',
};

/** 入力フォーム用の長いラベル付きルール一覧（短いラベルは RULESET_LABEL） */
export const RULESET_OPTIONS: ReadonlyArray<{ id: Ruleset; label: string }> = RULESETS.map(
  (id) => ({ id, label: RULESET_LONG_LABEL[id] }),
);

export const STORED_GENRE_OPTIONS: ReadonlyArray<{ id: StoredGenre; label: string }> = [
  { id: 'free_5', label: 'フリー5' },
  { id: 'free_1', label: 'フリー1' },
  { id: 'friend', label: '友人' },
];

export const GENRE_LABEL: Record<StoredGenre, string> = {
  free_5: 'フリー5',
  free_1: 'フリー1',
  friend: '友人',
};

export const RULESET_LABEL: Record<Ruleset, string> = {
  '4ma': '4麻',
  '3ma': '3麻',
};

export function maxRankForRuleset(ruleset: Ruleset): number {
  return ruleset === '4ma' ? 4 : 3;
}

/**
 * ★（高得点トップ）判定の閾値。
 * 4麻: 50000点以上、3麻: 70000点以上のトップ。
 */
export const STAR_THRESHOLD: Record<Ruleset, number> = {
  '4ma': 50000,
  '3ma': 70000,
};

/**
 * 配給原点（持ち点）。一般的な 4麻 25000点持ち / 3麻 35000点持ちを想定。
 */
export const STARTING_SCORE: Record<Ruleset, number> = {
  '4ma': 25000,
  '3ma': 35000,
};

/**
 * 原点（返し）。最終素点がこれを上回ればプラス、下回ればマイナス。
 * 一般的な 4麻 25000点持ち30000点返し / 3麻 35000点持ち40000点返しを想定。
 */
export const ORIGIN_SCORE: Record<Ruleset, number> = {
  '4ma': 30000,
  '3ma': 40000,
};
