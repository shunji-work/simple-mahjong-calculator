import {
  FuAssistantResult,
  FuAssistantState,
  GameState,
  HanFuInput,
  ManualState,
  ScoreResult,
} from '../types/mahjong';
import { YAKU_LIST } from '../data/yaku';
import { getEffectiveHan, isDaisangen, isYakumanSelected, MENZEN_TSUMO_YAKU_ID } from '../data/yakuRules';

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

interface LimitHand {
  minHan: number;
  name: string;
  basePoints: number;
}

// 翻数の大きい順に並べ、最初に条件を満たしたものを採用する
const LIMIT_HANDS: LimitHand[] = [
  { minHan: 13, name: '数え役満', basePoints: 8000 },
  { minHan: 11, name: '三倍満', basePoints: 6000 },
  { minHan: 8, name: '倍満', basePoints: 4000 },
  { minHan: 6, name: '跳満', basePoints: 3000 },
  { minHan: 5, name: '満貫', basePoints: 2000 },
];

const MANGAN = LIMIT_HANDS[LIMIT_HANDS.length - 1];

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

function buildScoreResult(
  { han, fu, isOya, winMethod }: HanFuInput,
  basePoints: number,
  scoreName: string,
): ScoreResult {
  const common = { fu, totalHan: han, basePoints, isOya, scoreName };

  if (winMethod === 'ron') {
    return { ...common, totalPay: roundUpToHundred(basePoints * (isOya ? 6 : 4)) };
  }

  if (isOya) {
    const koPay = roundUpToHundred(basePoints * 2);
    return { ...common, koPay, totalPay: koPay * 3 };
  }

  const oyaPay = roundUpToHundred(basePoints * 2);
  const koPay = roundUpToHundred(basePoints);
  return { ...common, oyaPay, koPay, totalPay: oyaPay + koPay * 2 };
}

function resolveLimitHand(han: number, fu: number): LimitHand | null {
  const limitHand = LIMIT_HANDS.find((limit) => han >= limit.minHan);
  if (limitHand) return limitHand;
  // 切り上げ満貫（4翻30符・3翻60符）を採用する
  const isKiriageMangan = (han === 4 && fu === 30) || (han === 3 && fu === 60);
  if (isKiriageMangan) return MANGAN;
  if (fu * 2 ** (han + 2) >= MANGAN.basePoints) return MANGAN;
  return null;
}

export function calculateScoreFromHanFu(input: HanFuInput): ScoreResult | null {
  const { han, fu } = input;

  if (han < 1 || fu < 20) {
    return null;
  }

  const limitHand = resolveLimitHand(han, fu);
  const basePoints = limitHand ? limitHand.basePoints : fu * 2 ** (han + 2);
  const scoreName = input.scoreName ?? limitHand?.name ?? `${han}翻${fu}符`;
  return buildScoreResult(input, basePoints, scoreName);
}

/**
 * 実在しない翻数・符の組み合わせならエラーメッセージを返す。
 * 20符は門前ツモの平和、25符は七対子でしか成立しない。
 */
export function getHanFuError({
  han,
  fu,
  hasNaki,
  winMethod,
}: Pick<HanFuInput, 'han' | 'fu' | 'winMethod'> & Pick<GameState, 'hasNaki'>): string | null {
  if (fu === 20) {
    if (hasNaki) return '20符（平和ツモ）は鳴きありでは成立しません';
    if (winMethod === 'ron') return '20符（平和ツモ）はロンでは成立しません。平和のロンは30符です';
    if (han < 2) return '20符（平和ツモ）は門前ツモと平和で最低2翻になります';
  }

  if (fu === 25) {
    if (hasNaki) return '25符（七対子）は鳴きありでは成立しません';
    if (han < 2) return '25符（七対子）は七対子だけで2翻あるため、1翻にはなりません';
  }

  return null;
}


/**
 * 役選択モード用の符。手牌の形までは入力しないため代表値で近似する。
 * 七対子 25符、平和ツモ 20符、平和ロン 30符、門前ロン 40符、それ以外 30符。
 */
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

function isAutoMenzenTsumo(gameState: GameState): boolean {
  return (
    gameState.winMethod === 'tsumo' &&
    !gameState.hasNaki &&
    !gameState.selectedYaku.includes(MENZEN_TSUMO_YAKU_ID)
  );
}

/** 役が1つ以上あるか（ドラは役に数えない。門前ツモは自動で役になる） */
export function hasYaku(gameState: GameState): boolean {
  return (
    gameState.selectedYaku.some((id) => YAKU_LIST.some((yaku) => yaku.id === id)) ||
    isAutoMenzenTsumo(gameState)
  );
}

export function calculateScore(gameState: GameState): ScoreResult | null {
  if (!hasYaku(gameState)) {
    return null;
  }

  const baseInput = {
    fu: calculateFu(gameState),
    isOya: gameState.isOya,
    winMethod: gameState.winMethod,
  };

  // 役満は翻数を加算しない（食い下がり・ドラの影響を受けない）
  if (isYakumanSelected(gameState.selectedYaku)) {
    return calculateScoreFromHanFu({
      ...baseInput,
      han: 13,
      scoreName: isDaisangen(gameState.selectedYaku) ? '大三元（役満）' : '役満',
    });
  }

  const yakuHan = YAKU_LIST.filter((yaku) => gameState.selectedYaku.includes(yaku.id)).reduce(
    (sum, yaku) => sum + getEffectiveHan(yaku, gameState.hasNaki),
    0,
  );
  const totalHan = yakuHan + gameState.doraCount + (isAutoMenzenTsumo(gameState) ? 1 : 0);

  return calculateScoreFromHanFu({ ...baseInput, han: totalHan });
}
