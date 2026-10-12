import { describe, expect, it } from 'vitest';
import { MEMO_MAX_LENGTH, SCORE_MAX, SCORE_MIN, SCORE_UNIT } from './gameValidation';
import { RULESETS, STORED_GENRE_OPTIONS, maxRankForRuleset } from '../types/game';

/**
 * アプリ側の入力チェックと、DB の CHECK 制約（supabase/migrations）の値がズレていないかを確かめる。
 * どちらか片方だけを変えたときに、このテストが落ちて気づけるようにする。
 */
const migrations = import.meta.glob<string>('../../supabase/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const sql = Object.values(migrations).join('\n');

function match(pattern: RegExp): RegExpMatchArray {
  const found = sql.match(pattern);
  if (!found) throw new Error(`マイグレーションに ${pattern} が見つかりません`);
  return found;
}

function parseStringList(list: string): string[] {
  return [...list.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
}

describe('入力チェックと DB の CHECK 制約の一致', () => {
  it('reads at least one migration', () => {
    expect(Object.keys(migrations).length).toBeGreaterThan(0);
  });

  it('score の範囲と単位', () => {
    const [, min, max, unit] = match(
      /score between (-?\d+) and (-?\d+) and score % (\d+) = 0/,
    );
    expect({ min: Number(min), max: Number(max), unit: Number(unit) }).toEqual({
      min: SCORE_MIN,
      max: SCORE_MAX,
      unit: SCORE_UNIT,
    });
  });

  it('memo の最大文字数', () => {
    const [, maxLength] = match(/char_length\(memo\) <= (\d+)/);
    expect(Number(maxLength)).toBe(MEMO_MAX_LENGTH);
  });

  it('ruleset の種類', () => {
    const [, list] = match(/ruleset in \(([^)]*)\)/);
    expect(parseStringList(list)).toEqual([...RULESETS].sort());
  });

  it('genre の種類', () => {
    const [, list] = match(/genre in \(([^)]*)\)/);
    expect(parseStringList(list)).toEqual(STORED_GENRE_OPTIONS.map((option) => option.id).sort());
  });

  it.each(RULESETS)('%s の順位の上限', (ruleset) => {
    const [, maxRank] = match(new RegExp(`ruleset = '${ruleset}' and rank between 1 and (\\d+)`));
    expect(Number(maxRank)).toBe(maxRankForRuleset(ruleset));
  });
});
