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

export const RULESET_OPTIONS: ReadonlyArray<{ id: Ruleset; label: string }> = [
  { id: '4ma', label: '4麻（四人麻雀）' },
  { id: '3ma', label: '3麻（三人麻雀）' },
];

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
