import { describe, expect, it } from 'vitest';
import { generateScoreAdvice } from './gameAdvice';

describe('generateScoreAdvice', () => {
  it('returns a zero-cost local analysis note when there are no records', () => {
    const advice = generateScoreAdvice([], '4ma');

    expect(advice.variant).toBe('neutral');
    expect(advice.message).toContain('点数の上がり方');
    expect(advice.detail).toContain('AI API費用');
  });

  it('uses the first record as a baseline', () => {
    const advice = generateScoreAdvice([{ score: 32500, rank: 2 }], '4ma');

    expect(advice.title).toBe('まずは基準作り');
    expect(advice.message).toContain('32,500点');
    expect(advice.detail).toContain('トップ率0%');
  });

  it('detects a recent rising score trend', () => {
    const advice = generateScoreAdvice(
      [
        { score: 21000, rank: 4 },
        { score: 30500, rank: 2 },
        { score: 42000, rank: 1 },
      ],
      '4ma',
    );

    expect(advice.variant).toBe('positive');
    expect(advice.title).toBe('上向き');
    expect(advice.detail).toContain('前回比+11,500点');
  });

  it('detects a recent falling score trend', () => {
    const advice = generateScoreAdvice(
      [
        { score: 45000, rank: 1 },
        { score: 33000, rank: 2 },
        { score: 18000, rank: 4 },
      ],
      '4ma',
    );

    expect(advice.variant).toBe('caution');
    expect(advice.title).toBe('下げ止めたい');
    expect(advice.detail).toContain('前回比-15,000点');
  });

  it('prioritizes back-to-back top finishes', () => {
    const advice = generateScoreAdvice(
      [
        { score: 23000, rank: 4 },
        { score: 41000, rank: 1 },
        { score: 39000, rank: 1 },
      ],
      '4ma',
    );

    expect(advice.variant).toBe('positive');
    expect(advice.title).toBe('連続トップ');
  });

  it('detects large score spread for 3-player records', () => {
    const advice = generateScoreAdvice(
      [
        { score: 12000, rank: 3 },
        { score: 52000, rank: 1 },
        { score: 48000, rank: 2 },
      ],
      '3ma',
    );

    expect(advice.variant).toBe('caution');
    expect(advice.title).toBe('振れ幅大きめ');
  });
});
