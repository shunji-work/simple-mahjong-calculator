import {
  FuAssistantResult,
  FuAssistantState,
  GameState,
  HanFuInput,
  ManualState,
  ScoreResult,
} from '../types/mahjong';
import { YAKU_LIST } from '../data/yaku';

const FU_ASSISTANT_MELD_KEYS: Array<
  keyof Pick<
    FuAssistantState,
    | 'terminalConcealedTriplets'
    | 'terminalOpenTriplets'
    | 'simpleConcealedTriplets'
    | 'simpleOpenTriplets'
    | 'terminalConcealedKans'
    | 'terminalOpenKans'
    | 'simpleConcealedKans'
    | 'simpleOpenKans'
  >
> = [
  'terminalConcealedTriplets',
  'terminalOpenTriplets',
  'simpleConcealedTriplets',
  'simpleOpenTriplets',
  'terminalConcealedKans',
  'terminalOpenKans',
  'simpleConcealedKans',
  'simpleOpenKans',
];

const FU_ASSISTANT_OPEN_KEYS: Array<
  keyof Pick<
    FuAssistantState,
    'terminalOpenTriplets' | 'simpleOpenTriplets' | 'terminalOpenKans' | 'simpleOpenKans'
  >
> = ['terminalOpenTriplets', 'simpleOpenTriplets', 'terminalOpenKans', 'simpleOpenKans'];

const MANGAN_SCORES = {
  ko: { ron: 8000, tsumoOya: 4000, tsumoKo: 2000 },
  oya: { ron: 12000, tsumo: 4000 },
};

const HANEMAN_SCORES = {
  ko: { ron: 12000, tsumoOya: 6000, tsumoKo: 3000 },
  oya: { ron: 18000, tsumo: 6000 },
};

const BAIMAN_SCORES = {
  ko: { ron: 16000, tsumoOya: 8000, tsumoKo: 4000 },
  oya: { ron: 24000, tsumo: 8000 },
};

const SANBAIMAN_SCORES = {
  ko: { ron: 24000, tsumoOya: 12000, tsumoKo: 6000 },
  oya: { ron: 36000, tsumo: 12000 },
};

const YAKUMAN_SCORES = {
  ko: { ron: 32000, tsumoOya: 16000, tsumoKo: 8000 },
  oya: { ron: 48000, tsumo: 16000 },
};

function roundUpToHundred(value: number): number {
  return Math.ceil(value / 100) * 100;
}

function roundUpToTen(value: number): number {
  return Math.ceil(value / 10) * 10;
}

export function getFuAssistantMeldCount(state: FuAssistantState): number {
  return FU_ASSISTANT_MELD_KEYS.reduce((sum, key) => sum + state[key], 0);
}

export function getMaxRemainingMeldSlots(state: FuAssistantState): number {
  return Math.max(0, 4 - getFuAssistantMeldCount(state));
}

export function isFuAssistantApplicable(manualState: Pick<ManualState, 'han'>): boolean {
  return manualState.han == null || manualState.han <= 3;
}

export function sanitizeFuAssistantState(
  state: FuAssistantState,
  options: Pick<GameState, 'hasNaki'>,
): FuAssistantState {
  let nextState: FuAssistantState = { ...state };

  if (!options.hasNaki) {
    FU_ASSISTANT_OPEN_KEYS.forEach((key) => {
      nextState[key] = 0;
    });
  }

  if (nextState.specialCase === 'chiitoitsu' || nextState.specialCase === 'pinfu') {
    nextState = {
      ...nextState,
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
    };
  }

  let totalMelds = getFuAssistantMeldCount(nextState);
  if (totalMelds > 4) {
    for (const key of [...FU_ASSISTANT_MELD_KEYS].reverse()) {
      while (nextState[key] > 0 && totalMelds > 4) {
        nextState[key] -= 1;
        totalMelds -= 1;
      }
    }
  }

  return nextState;
}

export function validateFuAssistantInput(
  input: FuAssistantState & Pick<GameState, 'hasNaki' | 'winMethod'> & Pick<ManualState, 'han'>,
): string | null {
  const meldCount = getFuAssistantMeldCount(input);
  if (meldCount > 4) {
    return '面子数が4を超えています';
  }

  if (!input.hasNaki && FU_ASSISTANT_OPEN_KEYS.some((key) => input[key] > 0)) {
    return '門前では明刻・明槓を指定できません';
  }

  if (input.specialCase === 'chiitoitsu') {
    if (meldCount > 0 || input.waitType !== 'none' || input.isYakuhaiPair) {
      return '七対子では刻子・槓子・待ち・役牌頭を指定できません';
    }
    return null;
  }

  if (input.specialCase === 'pinfu') {
    if (meldCount > 0 || input.waitType !== 'none' || input.isYakuhaiPair) {
      return '平和では符が付く入力を指定できません';
    }
  }

  return null;
}

function buildNormalScoreResult({
  han,
  fu,
  isOya,
  winMethod,
  scoreName,
}: HanFuInput): ScoreResult {
  const basePoints = fu * 2 ** (han + 2);

  if (winMethod === 'tsumo') {
    if (isOya) {
      const pay = roundUpToHundred(basePoints * 2);
      return {
        fu,
        totalHan: han,
        basePoints,
        oyaPay: pay,
        koPay: pay,
        ronPay: pay * 3,
        scoreName: scoreName ?? `${han}翻${fu}符`,
      };
    }

    const oyaPay = roundUpToHundred(basePoints * 2);
    const koPay = roundUpToHundred(basePoints);
    return {
      fu,
      totalHan: han,
      basePoints,
      oyaPay,
      koPay,
      ronPay: oyaPay + koPay * 2,
      scoreName: scoreName ?? `${han}翻${fu}符`,
    };
  }

  const ronPay = roundUpToHundred(basePoints * (isOya ? 6 : 4));
  return {
    fu,
    totalHan: han,
    basePoints,
    ronPay,
    scoreName: scoreName ?? `${han}翻${fu}符`,
  };
}

function buildLimitScoreResult({
  han,
  fu,
  isOya,
  winMethod,
  scoreName,
}: HanFuInput): ScoreResult {
  let ronPay = 0;
  let oyaPay: number | undefined;
  let koPay: number | undefined;
  const limitType =
    scoreName?.includes('役満')
      ? '役満'
      : scoreName === '三倍満'
      ? '三倍満'
      : scoreName === '倍満'
      ? '倍満'
      : scoreName === '跳満'
      ? '跳満'
      : '満貫';

  if (limitType === '役満') {
    if (isOya) {
      ronPay = YAKUMAN_SCORES.oya.ron;
      if (winMethod === 'tsumo') {
        oyaPay = YAKUMAN_SCORES.oya.tsumo;
        koPay = YAKUMAN_SCORES.oya.tsumo;
      }
    } else {
      ronPay = YAKUMAN_SCORES.ko.ron;
      if (winMethod === 'tsumo') {
        oyaPay = YAKUMAN_SCORES.ko.tsumoOya;
        koPay = YAKUMAN_SCORES.ko.tsumoKo;
      }
    }
  } else if (limitType === '三倍満') {
    if (isOya) {
      ronPay = SANBAIMAN_SCORES.oya.ron;
      if (winMethod === 'tsumo') {
        oyaPay = SANBAIMAN_SCORES.oya.tsumo;
        koPay = SANBAIMAN_SCORES.oya.tsumo;
      }
    } else {
      ronPay = SANBAIMAN_SCORES.ko.ron;
      if (winMethod === 'tsumo') {
        oyaPay = SANBAIMAN_SCORES.ko.tsumoOya;
        koPay = SANBAIMAN_SCORES.ko.tsumoKo;
      }
    }
  } else if (limitType === '倍満') {
    if (isOya) {
      ronPay = BAIMAN_SCORES.oya.ron;
      if (winMethod === 'tsumo') {
        oyaPay = BAIMAN_SCORES.oya.tsumo;
        koPay = BAIMAN_SCORES.oya.tsumo;
      }
    } else {
      ronPay = BAIMAN_SCORES.ko.ron;
      if (winMethod === 'tsumo') {
        oyaPay = BAIMAN_SCORES.ko.tsumoOya;
        koPay = BAIMAN_SCORES.ko.tsumoKo;
      }
    }
  } else if (limitType === '跳満') {
    if (isOya) {
      ronPay = HANEMAN_SCORES.oya.ron;
      if (winMethod === 'tsumo') {
        oyaPay = HANEMAN_SCORES.oya.tsumo;
        koPay = HANEMAN_SCORES.oya.tsumo;
      }
    } else {
      ronPay = HANEMAN_SCORES.ko.ron;
      if (winMethod === 'tsumo') {
        oyaPay = HANEMAN_SCORES.ko.tsumoOya;
        koPay = HANEMAN_SCORES.ko.tsumoKo;
      }
    }
  } else {
    if (isOya) {
      ronPay = MANGAN_SCORES.oya.ron;
      if (winMethod === 'tsumo') {
        oyaPay = MANGAN_SCORES.oya.tsumo;
        koPay = MANGAN_SCORES.oya.tsumo;
      }
    } else {
      ronPay = MANGAN_SCORES.ko.ron;
      if (winMethod === 'tsumo') {
        oyaPay = MANGAN_SCORES.ko.tsumoOya;
        koPay = MANGAN_SCORES.ko.tsumoKo;
      }
    }
  }

  return {
    fu,
    totalHan: han,
    basePoints: ronPay,
    oyaPay,
    koPay,
    ronPay,
    scoreName: scoreName ?? `${han}翻${fu}符`,
  };
}

function resolveLimitName(han: number, fu: number): string | null {
  if (han >= 13) return '役満';
  if (han >= 11) return '三倍満';
  if (han >= 8) return '倍満';
  if (han >= 6) return '跳満';
  if (han >= 5) return '満貫';
  if (han === 4 && fu >= 30) return '満貫';
  return null;
}

export function calculateScoreFromHanFu(input: HanFuInput): ScoreResult | null {
  const { han, fu } = input;

  if (han < 1 || fu < 20) {
    return null;
  }

  const limitName = resolveLimitName(han, fu);
  if (limitName) {
    return buildLimitScoreResult({
      ...input,
      scoreName: input.scoreName ?? limitName,
    });
  }

  return buildNormalScoreResult(input);
}

export function calculateFu(gameState: GameState): number {
  const hasChiitoitsu = gameState.selectedYaku.includes('chiitoitsu');
  if (hasChiitoitsu) return 25;

  const hasPinfu = gameState.selectedYaku.includes('pinfu');
  const isTsumo = gameState.winMethod === 'tsumo';
  const isRon = gameState.winMethod === 'ron';

  if (hasPinfu && isTsumo) return 20;
  if (hasPinfu && isRon) return 30;
  if (!gameState.hasNaki && isRon) return 40;

  return 30;
}

export function calculateFuFromAssistant(
  input: FuAssistantState & Pick<GameState, 'hasNaki' | 'winMethod'> & Pick<ManualState, 'han'>,
): FuAssistantResult {
  const isApplicable = isFuAssistantApplicable(input);
  if (!isApplicable) {
    return {
      rawFu: 0,
      roundedFu: 0,
      specialCase: input.specialCase,
      isValid: false,
      isApplicable: false,
      error: '4翻以上では簡易符入力を使えません',
    };
  }

  const error = validateFuAssistantInput(input);
  if (error) {
    return {
      rawFu: 0,
      roundedFu: 0,
      specialCase: input.specialCase,
      isValid: false,
      isApplicable: true,
      error,
    };
  }

  if (input.specialCase === 'chiitoitsu') {
    return {
      rawFu: 25,
      roundedFu: 25,
      specialCase: 'chiitoitsu',
      isValid: true,
      isApplicable: true,
    };
  }

  if (input.specialCase === 'pinfu') {
    const pinfuFu = input.winMethod === 'tsumo' ? 20 : 30;
    return {
      rawFu: pinfuFu,
      roundedFu: pinfuFu,
      specialCase: 'pinfu',
      isValid: true,
      isApplicable: true,
    };
  }

  let rawFu = 20;
  rawFu += input.terminalConcealedTriplets * 8;
  rawFu += input.terminalOpenTriplets * 4;
  rawFu += input.simpleConcealedTriplets * 4;
  rawFu += input.simpleOpenTriplets * 2;
  rawFu += input.terminalConcealedKans * 32;
  rawFu += input.terminalOpenKans * 16;
  rawFu += input.simpleConcealedKans * 16;
  rawFu += input.simpleOpenKans * 8;

  if (input.waitType !== 'none') {
    rawFu += 2;
  }

  if (input.isYakuhaiPair) {
    rawFu += 2;
  }

  if (input.winMethod === 'tsumo') {
    rawFu += 2;
  }

  if (input.winMethod === 'ron' && !input.hasNaki) {
    rawFu += 10;
  }

  return {
    rawFu,
    roundedFu: rawFu === 20 ? 20 : Math.min(110, roundUpToTen(rawFu)),
    specialCase: 'none',
    isValid: true,
    isApplicable: true,
  };
}

export function calculateScore(gameState: GameState): ScoreResult | null {
  const hasDaisangen =
    gameState.selectedYaku.includes('haku') &&
    gameState.selectedYaku.includes('hatsu') &&
    gameState.selectedYaku.includes('chun');

  const selectedYakuData = gameState.selectedYaku
    .map((id) => YAKU_LIST.find((yaku) => yaku.id === id))
    .filter(Boolean);

  const hasAutoTsumo =
    gameState.winMethod === 'tsumo' &&
    !gameState.hasNaki &&
    !gameState.selectedYaku.includes('tsumo');

  if (selectedYakuData.length === 0 && gameState.doraCount === 0 && !hasAutoTsumo) {
    return null;
  }

  let totalHan = selectedYakuData.reduce((sum, yaku) => sum + (yaku?.han || 0), 0);
  totalHan += gameState.doraCount;

  if (hasAutoTsumo) {
    totalHan += 1;
  }

  if (hasDaisangen) {
    totalHan = Math.max(totalHan, 13);
  }

  if (gameState.hasNaki) {
    const kuisagariYaku = [
      'sanshokudoujun',
      'ikkitsuukan',
      'chanta',
      'junchan',
      'honitsu',
      'chinitsu',
    ];

    kuisagariYaku.forEach((yakuId) => {
      const yaku = selectedYakuData.find((item) => item?.id === yakuId);
      if (yaku) {
        totalHan -= 1;
      }
    });
  }

  const fu = calculateFu(gameState);
  const score = calculateScoreFromHanFu({
    han: totalHan,
    fu,
    isOya: gameState.isOya,
    winMethod: gameState.winMethod,
    scoreName: hasDaisangen ? '大三元（役満）' : undefined,
  });

  if (!score) {
    return null;
  }

  return {
    ...score,
    scoreName: hasDaisangen ? '大三元（役満）' : score.scoreName,
  };
}
