import { useEffect, useMemo, useState } from 'react';
import { FuAssistantState, ManualState } from '../types/mahjong';
import {
  calculateFuFromAssistant,
  calculateScoreFromHanFu,
  getHanFuError,
  isFuAssistantApplicable,
  sanitizeFuAssistantState,
} from '../utils/scoreCalculator';

const DEFAULT_MANUAL_STATE: ManualState = {
  isOya: false,
  winMethod: 'ron',
  hasNaki: false,
  han: null,
  fu: null,
  fuSource: 'manual',
};

const DEFAULT_FU_ASSISTANT_STATE: FuAssistantState = {
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

/** 翻符入力モード（符計算補助を含む）の状態と操作 */
export function useManualMode() {
  const [manualState, setManualState] = useState<ManualState>(DEFAULT_MANUAL_STATE);
  const [hasTouchedFuAssistant, setHasTouchedFuAssistant] = useState(false);
  const [fuAssistantState, setFuAssistantState] = useState<FuAssistantState>(
    DEFAULT_FU_ASSISTANT_STATE,
  );

  const fuAssistantResult = useMemo(
    () =>
      calculateFuFromAssistant({
        ...fuAssistantState,
        han: manualState.han,
        hasNaki: manualState.hasNaki,
        winMethod: manualState.winMethod,
      }),
    [fuAssistantState, manualState.han, manualState.hasNaki, manualState.winMethod],
  );

  // 符計算補助を触ったあとは、補助の結果を上段の符へ反映する
  useEffect(() => {
    if (!hasTouchedFuAssistant) {
      return;
    }

    if (!fuAssistantResult.isApplicable) {
      setManualState((prev) => ({
        ...prev,
        fuSource: prev.fuSource === 'assistant' ? 'manual' : prev.fuSource,
      }));
      return;
    }

    if (!fuAssistantResult.isValid) {
      return;
    }

    setManualState((prev) => ({
      ...prev,
      fu: fuAssistantResult.roundedFu,
      fuSource: 'assistant',
    }));
  }, [fuAssistantResult, hasTouchedFuAssistant]);

  useEffect(() => {
    setFuAssistantState((prev) => sanitizeFuAssistantState(prev, { hasNaki: manualState.hasNaki }));
  }, [manualState.hasNaki]);

  const error = useMemo(() => {
    if (manualState.han == null || manualState.fu == null) {
      return null;
    }
    return getHanFuError({
      han: manualState.han,
      fu: manualState.fu,
      hasNaki: manualState.hasNaki,
      winMethod: manualState.winMethod,
    });
  }, [manualState]);

  const score = useMemo(() => {
    if (manualState.han == null || manualState.fu == null || error) {
      return null;
    }

    return calculateScoreFromHanFu({
      han: manualState.han,
      fu: manualState.fu,
      isOya: manualState.isOya,
      winMethod: manualState.winMethod,
    });
  }, [manualState, error]);

  const warning = error ? { title: 'この翻数・符の組み合わせはありません', detail: error } : null;

  const updateManualState = <K extends keyof ManualState>(key: K, value: ManualState[K]) => {
    setManualState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /** 上段で符を直接入力したとき（補助からの反映ではなく手入力として扱う） */
  const setManualFu = (fu: number | null) => {
    setManualState((prev) => ({ ...prev, fu, fuSource: 'manual' }));
  };

  const updateFuAssistantState = <K extends keyof FuAssistantState>(
    key: K,
    value: FuAssistantState[K],
  ) => {
    if (!isFuAssistantApplicable({ han: manualState.han })) {
      return;
    }

    setHasTouchedFuAssistant(true);
    setFuAssistantState((prev) =>
      sanitizeFuAssistantState(
        {
          ...prev,
          [key]: value,
        },
        { hasNaki: manualState.hasNaki },
      ),
    );
  };

  const resetFuAssistant = () => {
    setFuAssistantState(DEFAULT_FU_ASSISTANT_STATE);
    setHasTouchedFuAssistant(false);
  };

  const reset = () => {
    setManualState(DEFAULT_MANUAL_STATE);
    resetFuAssistant();
  };

  return {
    manualState,
    fuAssistantState,
    fuAssistantResult,
    score,
    warning,
    updateManualState,
    setManualFu,
    updateFuAssistantState,
    resetFuAssistant,
    reset,
  };
}
