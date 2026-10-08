import { maxRankForRuleset, type Ruleset } from '../types/game';

/**
 * 最終素点の許容範囲。DB の CHECK 制約
 * (supabase/migrations/*_create_games.sql) と値を揃えること。
 */
export const SCORE_MIN = -999900;
export const SCORE_MAX = 999900;
/** 点数の最小単位（100点） */
export const SCORE_UNIT = 100;
/** メモの最大文字数。DB の CHECK 制約と値を揃えること。 */
export const MEMO_MAX_LENGTH = 200;

export interface GameFormInput {
  ruleset: Ruleset;
  /** 入力欄の文字列そのまま */
  score: string;
  rank: number | null;
  /** datetime-local の値 */
  playedAtLocal: string;
  memo: string;
}

export interface ValidatedGameForm {
  score: number;
  rank: number;
  /** ISO 8601 文字列 */
  playedAt: string;
  memo: string | null;
}

export type GameFormValidationResult =
  | { ok: true; value: ValidatedGameForm }
  | { ok: false; error: string };

const INTEGER_PATTERN = /^[+-]?\d+$/;

export function validateGameForm(input: GameFormInput): GameFormValidationResult {
  const trimmedScore = input.score.trim();
  if (trimmedScore === '') {
    return { ok: false, error: '点数を入力してください。' };
  }
  if (!INTEGER_PATTERN.test(trimmedScore)) {
    return { ok: false, error: '点数は整数で入力してください。' };
  }
  const score = Number(trimmedScore);
  if (!Number.isSafeInteger(score) || score < SCORE_MIN || score > SCORE_MAX) {
    return {
      ok: false,
      error: `点数は ${SCORE_MIN.toLocaleString('ja-JP')} 〜 ${SCORE_MAX.toLocaleString('ja-JP')} の範囲で入力してください。`,
    };
  }
  if (score % SCORE_UNIT !== 0) {
    return { ok: false, error: '点数は100点単位で入力してください。' };
  }

  const maxRank = maxRankForRuleset(input.ruleset);
  if (input.rank == null) {
    return { ok: false, error: '順位を選択してください。' };
  }
  if (!Number.isInteger(input.rank) || input.rank < 1 || input.rank > maxRank) {
    return { ok: false, error: `順位は1〜${maxRank}位から選択してください。` };
  }

  if (!input.playedAtLocal) {
    return { ok: false, error: '対局日時を入力してください。' };
  }
  const playedAtDate = new Date(input.playedAtLocal);
  if (Number.isNaN(playedAtDate.getTime())) {
    return { ok: false, error: '対局日時の形式が正しくありません。' };
  }

  const trimmedMemo = input.memo.trim();
  if (trimmedMemo.length > MEMO_MAX_LENGTH) {
    return { ok: false, error: `メモは${MEMO_MAX_LENGTH}文字以内で入力してください。` };
  }

  return {
    ok: true,
    value: {
      score,
      rank: input.rank,
      playedAt: playedAtDate.toISOString(),
      memo: trimmedMemo === '' ? null : trimmedMemo,
    },
  };
}
