import { GameState, ScoreResult } from '../types/mahjong';
import { YAKU_LIST } from '../data/yaku';

const SCORE_TABLE: { [key: string]: { [key: number]: number } } = {
  '20': { 2: 1300, 3: 2600, 4: 5200 },
  '25': { 2: 1600, 3: 3200, 4: 6400 },
  '30': { 1: 1000, 2: 2000, 3: 3900 },
  '40': { 1: 1300, 2: 2600, 3: 5200 },
};

const OYA_SCORE_TABLE: { [key: string]: { [key: number]: number } } = {
  '20': { 2: 2100, 3: 3900, 4: 7800 },
  '25': { 2: 2400, 3: 4800, 4: 9600 },
  '30': { 1: 1500, 2: 2900, 3: 5800 },
  '40': { 1: 2000, 2: 3900, 3: 7700 },
};

const TSUMO_KO_TABLE: { [key: string]: { [key: number]: { oya: number; ko: number } } } = {
  '20': {
    2: { oya: 700, ko: 400 },
    3: { oya: 1300, ko: 700 },
    4: { oya: 2600, ko: 1300 }
  },
  '25': {
    2: { oya: 800, ko: 400 },
    3: { oya: 1600, ko: 800 },
    4: { oya: 3200, ko: 1600 }
  },
  '30': {
    1: { oya: 500, ko: 300 },
    2: { oya: 1000, ko: 500 },
    3: { oya: 2000, ko: 1000 }
  },
  '40': {
    1: { oya: 700, ko: 400 },
    2: { oya: 1300, ko: 700 },
    3: { oya: 2600, ko: 1300 }
  },
};

const TSUMO_OYA_TABLE: { [key: string]: { [key: number]: number } } = {
  '20': { 2: 700, 3: 1300, 4: 2600 },
  '25': { 2: 800, 3: 1600, 4: 3200 },
  '30': { 1: 500, 2: 1000, 3: 2000 },
  '40': { 1: 700, 2: 1300, 3: 2600 },
};

const MANGAN_SCORES = {
  ko: { ron: 8000, tsumo_oya: 4000, tsumo_ko: 2000 },
  oya: { ron: 12000, tsumo: 4000 },
};

const HANEMAN_SCORES = {
  ko: { ron: 12000, tsumo_oya: 6000, tsumo_ko: 3000 },
  oya: { ron: 18000, tsumo: 6000 },
};

const BAIMAN_SCORES = {
  ko: { ron: 16000, tsumo_oya: 8000, tsumo_ko: 4000 },
  oya: { ron: 24000, tsumo: 8000 },
};

const SANBAIMAN_SCORES = {
  ko: { ron: 24000, tsumo_oya: 12000, tsumo_ko: 6000 },
  oya: { ron: 36000, tsumo: 12000 },
};

const YAKUMAN_SCORES = {
  ko: { ron: 32000, tsumo_oya: 16000, tsumo_ko: 8000 },
  oya: { ron: 48000, tsumo: 16000 },
};

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

export function calculateScore(gameState: GameState): ScoreResult | null {
  const selectedYakuData = gameState.selectedYaku
    .map(id => YAKU_LIST.find(y => y.id === id))
    .filter(Boolean);

  const hasAutoTsumo = gameState.winMethod === 'tsumo' && !gameState.hasNaki && !gameState.selectedYaku.includes('tsumo');

  if (selectedYakuData.length === 0 && gameState.doraCount === 0 && !hasAutoTsumo) return null;

  let totalHan = selectedYakuData.reduce((sum, yaku) => sum + (yaku?.han || 0), 0);
  totalHan += gameState.doraCount;

  if (hasAutoTsumo) {
    totalHan += 1;
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

    kuisagariYaku.forEach(yakuId => {
      const yaku = selectedYakuData.find(y => y?.id === yakuId);
      if (yaku) {
        totalHan -= 1;
      }
    });
  }

  const fu = calculateFu(gameState);
  const isOya = gameState.isOya;
  const isTsumo = gameState.winMethod === 'tsumo';

  let scoreName = '';
  let ronPay = 0;
  let oyaPay: number | undefined;
  let koPay: number | undefined;

  if (totalHan >= 13) {
    scoreName = '役満';
    if (isOya) {
      ronPay = YAKUMAN_SCORES.oya.ron;
      if (isTsumo) {
        oyaPay = YAKUMAN_SCORES.oya.tsumo;
        koPay = YAKUMAN_SCORES.oya.tsumo;
      }
    } else {
      ronPay = YAKUMAN_SCORES.ko.ron;
      if (isTsumo) {
        oyaPay = YAKUMAN_SCORES.ko.tsumo_oya;
        koPay = YAKUMAN_SCORES.ko.tsumo_ko;
      }
    }
  } else if (totalHan >= 11) {
    scoreName = '三倍満';
    if (isOya) {
      ronPay = SANBAIMAN_SCORES.oya.ron;
      if (isTsumo) {
        oyaPay = SANBAIMAN_SCORES.oya.tsumo;
        koPay = SANBAIMAN_SCORES.oya.tsumo;
      }
    } else {
      ronPay = SANBAIMAN_SCORES.ko.ron;
      if (isTsumo) {
        oyaPay = SANBAIMAN_SCORES.ko.tsumo_oya;
        koPay = SANBAIMAN_SCORES.ko.tsumo_ko;
      }
    }
  } else if (totalHan >= 8) {
    scoreName = '倍満';
    if (isOya) {
      ronPay = BAIMAN_SCORES.oya.ron;
      if (isTsumo) {
        oyaPay = BAIMAN_SCORES.oya.tsumo;
        koPay = BAIMAN_SCORES.oya.tsumo;
      }
    } else {
      ronPay = BAIMAN_SCORES.ko.ron;
      if (isTsumo) {
        oyaPay = BAIMAN_SCORES.ko.tsumo_oya;
        koPay = BAIMAN_SCORES.ko.tsumo_ko;
      }
    }
  } else if (totalHan >= 6) {
    scoreName = '跳満';
    if (isOya) {
      ronPay = HANEMAN_SCORES.oya.ron;
      if (isTsumo) {
        oyaPay = HANEMAN_SCORES.oya.tsumo;
        koPay = HANEMAN_SCORES.oya.tsumo;
      }
    } else {
      ronPay = HANEMAN_SCORES.ko.ron;
      if (isTsumo) {
        oyaPay = HANEMAN_SCORES.ko.tsumo_oya;
        koPay = HANEMAN_SCORES.ko.tsumo_ko;
      }
    }
  } else if (totalHan >= 5) {
    scoreName = '満貫';
    if (isOya) {
      ronPay = MANGAN_SCORES.oya.ron;
      if (isTsumo) {
        oyaPay = MANGAN_SCORES.oya.tsumo;
        koPay = MANGAN_SCORES.oya.tsumo;
      }
    } else {
      ronPay = MANGAN_SCORES.ko.ron;
      if (isTsumo) {
        oyaPay = MANGAN_SCORES.ko.tsumo_oya;
        koPay = MANGAN_SCORES.ko.tsumo_ko;
      }
    }
  } else {
    if ((fu === 30 || fu === 40) && totalHan === 4) {
      scoreName = '満貫';
      if (isOya) {
        ronPay = MANGAN_SCORES.oya.ron;
        if (isTsumo) {
          oyaPay = MANGAN_SCORES.oya.tsumo;
          koPay = MANGAN_SCORES.oya.tsumo;
        }
      } else {
        ronPay = MANGAN_SCORES.ko.ron;
        if (isTsumo) {
          oyaPay = MANGAN_SCORES.ko.tsumo_oya;
          koPay = MANGAN_SCORES.ko.tsumo_ko;
        }
      }
    } else {
      const scoreTable = isOya ? OYA_SCORE_TABLE : SCORE_TABLE;
      const fuKey = fu.toString();

      if (scoreTable[fuKey] && scoreTable[fuKey][totalHan]) {
        const baseScore = scoreTable[fuKey][totalHan];

        if (isTsumo) {
          if (isOya) {
            const oyaTsumoTable = TSUMO_OYA_TABLE[fuKey];
            if (oyaTsumoTable && oyaTsumoTable[totalHan]) {
              oyaPay = oyaTsumoTable[totalHan];
              koPay = oyaTsumoTable[totalHan];
              ronPay = oyaPay * 3;
            }
          } else {
            const koTsumoTable = TSUMO_KO_TABLE[fuKey];
            if (koTsumoTable && koTsumoTable[totalHan]) {
              oyaPay = koTsumoTable[totalHan].oya;
              koPay = koTsumoTable[totalHan].ko;
              ronPay = oyaPay + koPay * 2;
            }
          }
        } else {
          ronPay = baseScore;
        }

        scoreName = `${totalHan}翻${fu}符`;
      }
    }
  }

  return {
    fu,
    totalHan,
    basePoints: ronPay,
    oyaPay,
    koPay,
    ronPay,
    scoreName,
  };
}
