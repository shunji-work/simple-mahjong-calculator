import { describe, expect, it } from 'vitest';
import type { WinMethod } from '../types/mahjong';
import { calculateScoreFromHanFu, getHanFuError } from './scoreCalculator';

/**
 * 一般的な点数早見表（切り上げ満貫あり）との突き合わせ。
 * 実装の計算式から値を作らず、早見表の値をそのまま書き写している。
 * null は実在しない組み合わせ（getHanFuError がエラーを返すべきもの）。
 */

const FU_VALUES = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110] as const;
type Fu = (typeof FU_VALUES)[number];
type Row<T> = Record<Fu, T | null>;

function row<T>(values: Array<T | null>): Row<T> {
  return Object.fromEntries(FU_VALUES.map((fu, i) => [fu, values[i]])) as Row<T>;
}

const M = 8000; // 子の満貫
const OM = 12000; // 親の満貫

// 子のロン
const KO_RON: Record<number, Row<number>> = {
  //   20    25    30    40    50    60    70    80    90   100   110
  1: row([null, null, 1000, 1300, 1600, 2000, 2300, 2600, 2900, 3200, 3600]),
  2: row([null, 1600, 2000, 2600, 3200, 3900, 4500, 5200, 5800, 6400, 7100]),
  3: row([null, 3200, 3900, 5200, 6400, M, M, M, M, M, M]),
  4: row([null, 6400, M, M, M, M, M, M, M, M, M]),
};

// 親のロン
const OYA_RON: Record<number, Row<number>> = {
  //   20    25    30    40    50    60     70    80    90   100    110
  1: row([null, null, 1500, 2000, 2400, 2900, 3400, 3900, 4400, 4800, 5300]),
  2: row([null, 2400, 2900, 3900, 4800, 5800, 6800, 7700, 8700, 9600, 10600]),
  3: row([null, 4800, 5800, 7700, 9600, OM, OM, OM, OM, OM, OM]),
  4: row([null, 9600, OM, OM, OM, OM, OM, OM, OM, OM, OM]),
};

// 子のツモ [子の支払い, 親の支払い]
type KoTsumo = readonly [number, number];
const KM: KoTsumo = [2000, 4000];
const KO_TSUMO: Record<number, Row<KoTsumo>> = {
  1: row<KoTsumo>([
    null, null, [300, 500], [400, 700], [400, 800], [500, 1000],
    [600, 1200], [700, 1300], [800, 1500], [800, 1600], [900, 1800],
  ]),
  2: row<KoTsumo>([
    [400, 700], null, [500, 1000], [700, 1300], [800, 1600], [1000, 2000],
    [1200, 2300], [1300, 2600], [1500, 2900], [1600, 3200], [1800, 3600],
  ]),
  3: row<KoTsumo>([
    [700, 1300], [800, 1600], [1000, 2000], [1300, 2600], [1600, 3200], KM,
    KM, KM, KM, KM, KM,
  ]),
  4: row<KoTsumo>([[1300, 2600], [1600, 3200], KM, KM, KM, KM, KM, KM, KM, KM, KM]),
};

// 親のツモ（オール）
const OYA_TSUMO: Record<number, Row<number>> = {
  //   20    25    30    40    50    60    70    80    90   100   110
  1: row([null, null, 500, 700, 800, 1000, 1200, 1300, 1500, 1600, 1800]),
  2: row([700, null, 1000, 1300, 1600, 2000, 2300, 2600, 2900, 3200, 3600]),
  3: row([1300, 1600, 2000, 2600, 3200, 4000, 4000, 4000, 4000, 4000, 4000]),
  4: row([2600, 3200, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000]),
};

interface Payment {
  totalPay: number;
  koPay?: number;
  oyaPay?: number;
}

function expectedPayment(han: number, fu: Fu, isOya: boolean, winMethod: WinMethod): Payment | null {
  if (winMethod === 'ron') {
    const pay = (isOya ? OYA_RON : KO_RON)[han][fu];
    return pay == null ? null : { totalPay: pay };
  }
  if (isOya) {
    const all = OYA_TSUMO[han][fu];
    return all == null ? null : { koPay: all, totalPay: all * 3 };
  }
  const pays = KO_TSUMO[han][fu];
  return pays == null ? null : { koPay: pays[0], oyaPay: pays[1], totalPay: pays[0] * 2 + pays[1] };
}

const CASES = [1, 2, 3, 4].flatMap((han) =>
  FU_VALUES.flatMap((fu) =>
    [false, true].flatMap((isOya) =>
      (['ron', 'tsumo'] as const).map((winMethod) => ({
        han,
        fu,
        isOya,
        winMethod,
        who: isOya ? '親' : '子',
        how: winMethod === 'ron' ? 'ロン' : 'ツモ',
      })),
    ),
  ),
);

describe('点数早見表（1〜4翻 × 20〜110符 × 親子 × ツモロン）', () => {
  it.each(CASES)('$han翻$fu符 $who・$how', ({ han, fu, isOya, winMethod }) => {
    const expected = expectedPayment(han, fu, isOya, winMethod);
    // 門前が最も多くの組み合わせを許すため、門前で成立するかを判定する
    const error = getHanFuError({ han, fu, hasNaki: false, winMethod });

    if (expected == null) {
      expect(error).not.toBeNull();
      return;
    }

    expect(error).toBeNull();
    const result = calculateScoreFromHanFu({ han, fu, isOya, winMethod });
    expect(result).not.toBeNull();
    expect({ totalPay: result?.totalPay, koPay: result?.koPay, oyaPay: result?.oyaPay }).toEqual({
      koPay: undefined,
      oyaPay: undefined,
      ...expected,
    });
  });
});

const LIMIT_HANDS = [
  { han: 5, name: '満貫', koRon: 8000, oyaRon: 12000, koTsumo: [2000, 4000], oyaTsumo: 4000 },
  { han: 6, name: '跳満', koRon: 12000, oyaRon: 18000, koTsumo: [3000, 6000], oyaTsumo: 6000 },
  { han: 7, name: '跳満', koRon: 12000, oyaRon: 18000, koTsumo: [3000, 6000], oyaTsumo: 6000 },
  { han: 8, name: '倍満', koRon: 16000, oyaRon: 24000, koTsumo: [4000, 8000], oyaTsumo: 8000 },
  { han: 10, name: '倍満', koRon: 16000, oyaRon: 24000, koTsumo: [4000, 8000], oyaTsumo: 8000 },
  { han: 11, name: '三倍満', koRon: 24000, oyaRon: 36000, koTsumo: [6000, 12000], oyaTsumo: 12000 },
  { han: 12, name: '三倍満', koRon: 24000, oyaRon: 36000, koTsumo: [6000, 12000], oyaTsumo: 12000 },
  { han: 13, name: '数え役満', koRon: 32000, oyaRon: 48000, koTsumo: [8000, 16000], oyaTsumo: 16000 },
  { han: 20, name: '数え役満', koRon: 32000, oyaRon: 48000, koTsumo: [8000, 16000], oyaTsumo: 16000 },
] as const;

describe('満貫以上（符に関係なく固定）', () => {
  it.each(LIMIT_HANDS)('$han翻 $name', ({ han, name, koRon, oyaRon, koTsumo, oyaTsumo }) => {
    for (const fu of [30, 110]) {
      expect(calculateScoreFromHanFu({ han, fu, isOya: false, winMethod: 'ron' })).toMatchObject({
        totalPay: koRon,
        scoreName: name,
      });
      expect(calculateScoreFromHanFu({ han, fu, isOya: true, winMethod: 'ron' })).toMatchObject({
        totalPay: oyaRon,
        scoreName: name,
      });
      expect(calculateScoreFromHanFu({ han, fu, isOya: false, winMethod: 'tsumo' })).toMatchObject({
        koPay: koTsumo[0],
        oyaPay: koTsumo[1],
        scoreName: name,
      });
      expect(calculateScoreFromHanFu({ han, fu, isOya: true, winMethod: 'tsumo' })).toMatchObject({
        koPay: oyaTsumo,
        totalPay: oyaTsumo * 3,
        scoreName: name,
      });
    }
  });
});

describe('切り上げ満貫', () => {
  it.each([
    { han: 3, fu: 60 },
    { han: 4, fu: 30 },
  ])('$han翻$fu符は満貫として扱う', ({ han, fu }) => {
    expect(calculateScoreFromHanFu({ han, fu, isOya: false, winMethod: 'ron' })).toMatchObject({
      totalPay: 8000,
      scoreName: '満貫',
    });
  });
});
