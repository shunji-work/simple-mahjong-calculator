import { describe, expect, it } from 'vitest';
import {
  MEMO_MAX_LENGTH,
  SCORE_MAX,
  SCORE_MIN,
  validateGameForm,
  type GameFormInput,
} from './gameValidation';

const base: GameFormInput = {
  ruleset: '4ma',
  score: '32500',
  rank: 2,
  playedAtLocal: '2026-04-30T12:00',
  memo: '',
};

function errorOf(input: Partial<GameFormInput>): string | null {
  const result = validateGameForm({ ...base, ...input });
  return result.ok ? null : result.error;
}

describe('validateGameForm', () => {
  it('accepts a valid input and normalizes values', () => {
    const result = validateGameForm({ ...base, score: ' -3000 ', memo: '  逃げ切り  ' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.score).toBe(-3000);
    expect(result.value.rank).toBe(2);
    expect(result.value.memo).toBe('逃げ切り');
    expect(result.value.playedAt).toBe(new Date('2026-04-30T12:00').toISOString());
  });

  it('turns an empty memo into null', () => {
    const result = validateGameForm({ ...base, memo: '   ' });
    expect(result.ok && result.value.memo).toBeNull();
  });

  it('requires a score', () => {
    expect(errorOf({ score: '' })).toBe('点数を入力してください。');
    expect(errorOf({ score: '   ' })).toBe('点数を入力してください。');
  });

  it('rejects non-integer and exponent notations', () => {
    expect(errorOf({ score: '32500.5' })).toBe('点数は整数で入力してください。');
    expect(errorOf({ score: '1e10' })).toBe('点数は整数で入力してください。');
    expect(errorOf({ score: 'abc' })).toBe('点数は整数で入力してください。');
    expect(errorOf({ score: '0x100' })).toBe('点数は整数で入力してください。');
  });

  it('enforces score bounds', () => {
    expect(errorOf({ score: String(SCORE_MAX) })).toBeNull();
    expect(errorOf({ score: String(SCORE_MIN) })).toBeNull();
    expect(errorOf({ score: String(SCORE_MAX + 100) })).toMatch(/範囲で入力してください/);
    expect(errorOf({ score: String(SCORE_MIN - 100) })).toMatch(/範囲で入力してください/);
    expect(errorOf({ score: '10000000000' })).toMatch(/範囲で入力してください/);
  });

  it('requires multiples of 100', () => {
    expect(errorOf({ score: '32550' })).toBe('点数は100点単位で入力してください。');
    expect(errorOf({ score: '0' })).toBeNull();
  });

  it('requires a rank within the ruleset', () => {
    expect(errorOf({ rank: null })).toBe('順位を選択してください。');
    expect(errorOf({ ruleset: '4ma', rank: 4 })).toBeNull();
    expect(errorOf({ ruleset: '3ma', rank: 4 })).toBe('順位は1〜3位から選択してください。');
    expect(errorOf({ rank: 0 })).toBe('順位は1〜4位から選択してください。');
  });

  it('requires a valid played-at date', () => {
    expect(errorOf({ playedAtLocal: '' })).toBe('対局日時を入力してください。');
    expect(errorOf({ playedAtLocal: 'not-a-date' })).toBe('対局日時の形式が正しくありません。');
  });

  it('limits memo length', () => {
    expect(errorOf({ memo: 'あ'.repeat(MEMO_MAX_LENGTH) })).toBeNull();
    expect(errorOf({ memo: 'あ'.repeat(MEMO_MAX_LENGTH + 1) })).toBe(
      `メモは${MEMO_MAX_LENGTH}文字以内で入力してください。`,
    );
  });
});
