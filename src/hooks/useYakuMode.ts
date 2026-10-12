import { useMemo, useState } from 'react';
import { GameState, WinMethod } from '../types/mahjong';
import { YAKU_LIST } from '../data/yaku';
import {
  MENZEN_TSUMO_YAKU_ID,
  YAKUMAN_YAKU_ID,
  getIncompatibleYakuIds,
  isIncompatibleWithSelected,
  isYakumanSelected,
} from '../data/yakuRules';
import { calculateScore, hasYaku } from '../utils/scoreCalculator';

export const MAX_DORA = 20;

const DEFAULT_GAME_STATE: GameState = {
  selectedYaku: [],
  doraCount: 0,
  winMethod: 'ron',
  hasNaki: false,
  isOya: false,
};

const MENZEN_ONLY_YAKU_IDS = YAKU_LIST.filter((yaku) => yaku.menzenOnly).map((yaku) => yaku.id);

/** 役選択モードの状態と操作 */
export function useYakuMode() {
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);

  const toggleYaku = (yakuId: string) => {
    setGameState((prev) => {
      if (prev.selectedYaku.includes(yakuId)) {
        return { ...prev, selectedYaku: prev.selectedYaku.filter((id) => id !== yakuId) };
      }
      if (yakuId === YAKUMAN_YAKU_ID) {
        return { ...prev, selectedYaku: [YAKUMAN_YAKU_ID] };
      }
      const incompatible = getIncompatibleYakuIds(yakuId);
      const cleaned = prev.selectedYaku.filter((id) => !incompatible.has(id));
      return { ...prev, selectedYaku: [...cleaned, yakuId] };
    });
  };

  const setWinMethod = (method: WinMethod) => {
    setGameState((prev) => ({
      ...prev,
      winMethod: method,
      selectedYaku:
        method === 'ron'
          ? prev.selectedYaku.filter((id) => id !== MENZEN_TSUMO_YAKU_ID)
          : prev.selectedYaku,
    }));
  };

  const toggleNaki = () => {
    setGameState((prev) => {
      const newHasNaki = !prev.hasNaki;
      return {
        ...prev,
        hasNaki: newHasNaki,
        selectedYaku: newHasNaki
          ? prev.selectedYaku.filter((id) => !MENZEN_ONLY_YAKU_IDS.includes(id))
          : prev.selectedYaku,
      };
    });
  };

  const toggleOya = () => {
    setGameState((prev) => ({ ...prev, isOya: !prev.isOya }));
  };

  const reset = () => {
    setGameState(DEFAULT_GAME_STATE);
  };

  const incrementDora = () => {
    setGameState((prev) => ({
      ...prev,
      doraCount: Math.min(MAX_DORA, prev.doraCount + 1),
    }));
  };

  const decrementDora = () => {
    setGameState((prev) => ({
      ...prev,
      doraCount: Math.max(0, prev.doraCount - 1),
    }));
  };

  const score = useMemo(() => calculateScore(gameState), [gameState]);
  const warning =
    !score && gameState.doraCount > 0 && !hasYaku(gameState)
      ? {
          title: '役がありません',
          detail: 'ドラは役ではないため、ドラだけではアガれません。役を1つ以上選んでください。',
        }
      : null;

  const hasYakuman = isYakumanSelected(gameState.selectedYaku);
  const isYakuDisabled = (yakuId: string) => {
    const yaku = YAKU_LIST.find((item) => item.id === yakuId);
    if (!yaku) return false;
    if (gameState.selectedYaku.includes(yakuId)) return false;
    if (yaku.menzenOnly && gameState.hasNaki) return true;
    if (yakuId === MENZEN_TSUMO_YAKU_ID && gameState.winMethod === 'ron') return true;
    if (hasYakuman && yakuId !== YAKUMAN_YAKU_ID) return true;
    return isIncompatibleWithSelected(yakuId, gameState.selectedYaku);
  };

  return {
    gameState,
    score,
    warning,
    isYakuDisabled,
    toggleYaku,
    setWinMethod,
    toggleNaki,
    toggleOya,
    reset,
    incrementDora,
    decrementDora,
  };
}
