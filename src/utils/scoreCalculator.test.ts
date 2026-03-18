import { describe, expect, it } from 'vitest';
import {
  calculateFuFromAssistant,
  calculateScore,
  calculateScoreFromHanFu,
  getMaxRemainingMeldSlots,
  sanitizeFuAssistantState,
  validateFuAssistantInput,
} from './scoreCalculator';
import { FuAssistantState, GameState } from '../types/mahjong';

const baseAssistantState: FuAssistantState = {
  terminalConcealedTriplets: 0,
  terminalOpenTriplets: 0,
  simpleConcealedTriplets: 0,
  simpleOpenTriplets: 0,
  terminalConcealedKans: 0,
  terminalOpenKans: 0,
  simpleConcealedKans: 0,
  simpleOpenKans: 0,
  waitType: 'none',
  isYakuhaiPair: false,
  specialCase: 'none',
};

describe('calculateScoreFromHanFu', () => {
  it('calculates ko 30符1翻 ロン', () => {
    expect(
      calculateScoreFromHanFu({
        han: 1,
        fu: 30,
        isOya: false,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      ronPay: 1000,
      scoreName: '1翻30符',
    });
  });

  it('calculates oya 40符2翻 ロン', () => {
    expect(
      calculateScoreFromHanFu({
        han: 2,
        fu: 40,
        isOya: true,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      ronPay: 3900,
      scoreName: '2翻40符',
    });
  });

  it('calculates ko 20符2翻 ツモ', () => {
    expect(
      calculateScoreFromHanFu({
        han: 2,
        fu: 20,
        isOya: false,
        winMethod: 'tsumo',
      }),
    ).toMatchObject({
      oyaPay: 700,
      koPay: 400,
      ronPay: 1500,
      scoreName: '2翻20符',
    });
  });

  it('calculates oya 30符3翻 ツモ', () => {
    expect(
      calculateScoreFromHanFu({
        han: 3,
        fu: 30,
        isOya: true,
        winMethod: 'tsumo',
      }),
    ).toMatchObject({
      oyaPay: 2000,
      koPay: 2000,
      ronPay: 6000,
      scoreName: '3翻30符',
    });
  });

  it('treats 30符4翻 as mangan', () => {
    expect(
      calculateScoreFromHanFu({
        han: 4,
        fu: 30,
        isOya: false,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      ronPay: 8000,
      scoreName: '満貫',
    });
  });

  it('treats 40符4翻 as mangan', () => {
    expect(
      calculateScoreFromHanFu({
        han: 4,
        fu: 40,
        isOya: false,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      ronPay: 8000,
      scoreName: '満貫',
    });
  });

  it('treats 5翻以上 as limit hands', () => {
    expect(
      calculateScoreFromHanFu({
        han: 5,
        fu: 30,
        isOya: true,
        winMethod: 'tsumo',
      }),
    ).toMatchObject({
      oyaPay: 4000,
      koPay: 4000,
      scoreName: '満貫',
    });

    expect(
      calculateScoreFromHanFu({
        han: 13,
        fu: 30,
        isOya: false,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      ronPay: 32000,
      scoreName: '役満',
    });
  });
});

describe('calculateFuFromAssistant', () => {
  it('adds menzen ron, wait, yakuhai pair, triplet and rounds up', () => {
    expect(
      calculateFuFromAssistant({
        ...baseAssistantState,
        terminalConcealedTriplets: 1,
        waitType: 'kanchan',
        isYakuhaiPair: true,
        han: 3,
        hasNaki: false,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      rawFu: 42,
      roundedFu: 50,
      specialCase: 'none',
      isValid: true,
      isApplicable: true,
    });
  });

  it('adds tsumo fu and kan/triplet fu correctly', () => {
    expect(
      calculateFuFromAssistant({
        ...baseAssistantState,
        terminalOpenTriplets: 1,
        simpleConcealedTriplets: 1,
        simpleOpenKans: 1,
        han: 3,
        hasNaki: true,
        winMethod: 'tsumo',
      }),
    ).toMatchObject({
      rawFu: 38,
      roundedFu: 40,
      specialCase: 'none',
      isValid: true,
      isApplicable: true,
    });
  });

  it('returns fixed fu for chiitoitsu', () => {
    expect(
      calculateFuFromAssistant({
        ...baseAssistantState,
        specialCase: 'chiitoitsu',
        han: 2,
        hasNaki: false,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      rawFu: 25,
      roundedFu: 25,
      specialCase: 'chiitoitsu',
      isValid: true,
      isApplicable: true,
    });
  });

  it('returns fixed fu for pinfu tsumo and ron', () => {
    expect(
      calculateFuFromAssistant({
        ...baseAssistantState,
        specialCase: 'pinfu',
        han: 2,
        hasNaki: false,
        winMethod: 'tsumo',
      }),
    ).toMatchObject({
      rawFu: 20,
      roundedFu: 20,
      specialCase: 'pinfu',
      isValid: true,
      isApplicable: true,
    });

    expect(
      calculateFuFromAssistant({
        ...baseAssistantState,
        specialCase: 'pinfu',
        han: 2,
        hasNaki: false,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      rawFu: 30,
      roundedFu: 30,
      specialCase: 'pinfu',
      isValid: true,
      isApplicable: true,
    });
  });

  it('caps rounded fu at 110', () => {
    expect(
      calculateFuFromAssistant({
        ...baseAssistantState,
        terminalConcealedKans: 3,
        simpleConcealedTriplets: 1,
        han: 3,
        hasNaki: false,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      rawFu: 130,
      roundedFu: 110,
      isValid: true,
    });
  });

  it('rejects more than four melds', () => {
    expect(
      calculateFuFromAssistant({
        ...baseAssistantState,
        terminalConcealedTriplets: 5,
        han: 3,
        hasNaki: false,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      isValid: false,
      error: '面子数が4を超えています',
    });
  });

  it('rejects open melds in closed hand', () => {
    expect(
      validateFuAssistantInput({
        ...baseAssistantState,
        terminalOpenTriplets: 1,
        han: 2,
        hasNaki: false,
        winMethod: 'ron',
      }),
    ).toBe('門前では明刻・明槓を指定できません');
  });

  it('rejects fu-generating inputs for chiitoitsu and pinfu', () => {
    expect(
      validateFuAssistantInput({
        ...baseAssistantState,
        specialCase: 'chiitoitsu',
        simpleConcealedTriplets: 1,
        han: 2,
        hasNaki: false,
        winMethod: 'ron',
      }),
    ).toBe('七対子では刻子・槓子・待ち・役牌頭を指定できません');

    expect(
      validateFuAssistantInput({
        ...baseAssistantState,
        specialCase: 'pinfu',
        waitType: 'kanchan',
        han: 2,
        hasNaki: false,
        winMethod: 'ron',
      }),
    ).toBe('平和では符が付く入力を指定できません');
  });

  it('disables assistant for four han or more', () => {
    expect(
      calculateFuFromAssistant({
        ...baseAssistantState,
        han: 4,
        hasNaki: false,
        winMethod: 'ron',
      }),
    ).toMatchObject({
      isApplicable: false,
      isValid: false,
    });
  });
});

describe('fu assistant helpers', () => {
  it('returns remaining meld slots', () => {
    expect(
      getMaxRemainingMeldSlots({
        ...baseAssistantState,
        terminalConcealedTriplets: 1,
        simpleConcealedTriplets: 2,
      }),
    ).toBe(1);
  });

  it('sanitizes open melds and special cases', () => {
    expect(
      sanitizeFuAssistantState(
        {
          ...baseAssistantState,
          terminalOpenTriplets: 1,
          simpleOpenKans: 1,
        },
        { hasNaki: false },
      ),
    ).toMatchObject({
      terminalOpenTriplets: 0,
      simpleOpenKans: 0,
    });

    expect(
      sanitizeFuAssistantState(
        {
          ...baseAssistantState,
          specialCase: 'pinfu',
          terminalConcealedTriplets: 1,
          waitType: 'kanchan',
          isYakuhaiPair: true,
        },
        { hasNaki: false },
      ),
    ).toMatchObject({
      terminalConcealedTriplets: 0,
      waitType: 'none',
      isYakuhaiPair: false,
    });
  });
});

describe('calculateScore (yaku mode)', () => {
  const buildState = (overrides: Partial<GameState>): GameState => ({
    selectedYaku: [],
    doraCount: 0,
    winMethod: 'tsumo',
    hasNaki: false,
    isOya: false,
    ...overrides,
  });

  it('adds concealed tsumo automatically in yaku mode', () => {
    expect(
      calculateScore(
        buildState({
          selectedYaku: ['riichi'],
          winMethod: 'tsumo',
          hasNaki: false,
        }),
      ),
    ).toMatchObject({
      totalHan: 2,
      fu: 30,
      oyaPay: 1000,
      koPay: 500,
    });
  });

  it('applies kuisagari for open hands', () => {
    expect(
      calculateScore(
        buildState({
          selectedYaku: ['honitsu'],
          hasNaki: true,
          winMethod: 'ron',
        }),
      ),
    ).toMatchObject({
      totalHan: 2,
      fu: 30,
      ronPay: 2000,
      scoreName: '2翻30符',
    });
  });

  it('keeps daisangen as yakuman with dedicated label', () => {
    expect(
      calculateScore(
        buildState({
          selectedYaku: ['haku', 'hatsu', 'chun'],
          winMethod: 'ron',
          hasNaki: true,
        }),
      ),
    ).toMatchObject({
      totalHan: 13,
      ronPay: 32000,
      scoreName: '大三元（役満）',
    });
  });
});
