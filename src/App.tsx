import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import {
  AppMode,
  FuAssistantState,
  GameState,
  ManualState,
  WinMethod,
} from './types/mahjong';
import { YAKU_LIST, getCategoryYaku } from './data/yaku';
import {
  MENZEN_TSUMO_YAKU_ID,
  YAKUMAN_YAKU_ID,
  getIncompatibleYakuIds,
  isIncompatibleWithSelected,
  isYakumanSelected,
} from './data/yakuRules';
import {
  calculateFuFromAssistant,
  calculateScore,
  calculateScoreFromHanFu,
  getHanFuError,
  hasYaku,
  isFuAssistantApplicable,
  sanitizeFuAssistantState,
} from './utils/scoreCalculator';
import { ScoreDisplay } from './components/ScoreDisplay';
import { DoraCounter } from './components/DoraCounter';
import { ModeTabs } from './components/ModeTabs';
import { ManualScoreForm } from './components/ManualScoreForm';
import { FuAssistant } from './components/FuAssistant';
import { AuthButton } from './components/AuthButton';
import { TopTabs, type TopTab } from './components/TopTabs';
import { EmptyScoreCard } from './components/EmptyScoreCard';
import { YakuSection } from './components/YakuSection';
import { SelectedYakuSummary } from './components/SelectedYakuSummary';
import { YakuModeControls } from './components/YakuModeControls';
import { ManualStatusPanel } from './components/ManualStatusPanel';

// 戦績タブは recharts を含み大きいため、開いたときに読み込む
const RecordsView = lazy(() =>
  import('./components/RecordsView').then((module) => ({ default: module.RecordsView })),
);

const MAX_DORA = 20;

const DEFAULT_GAME_STATE: GameState = {
  selectedYaku: [],
  doraCount: 0,
  winMethod: 'tsumo',
  hasNaki: false,
  isOya: false,
};

const DEFAULT_MANUAL_STATE: ManualState = {
  isOya: false,
  winMethod: 'tsumo',
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

const S_RANK_YAKU = getCategoryYaku('S').filter((yaku) => yaku.id !== MENZEN_TSUMO_YAKU_ID);
const A_RANK_YAKU = getCategoryYaku('A');
const B_RANK_YAKU = getCategoryYaku('B');
const C_RANK_YAKU = getCategoryYaku('C');

function App() {
  const [topTab, setTopTab] = useState<TopTab>('calc');
  const [mode, setMode] = useState<AppMode>('yaku');
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [manualState, setManualState] = useState<ManualState>(DEFAULT_MANUAL_STATE);
  const [hasTouchedFuAssistant, setHasTouchedFuAssistant] = useState(false);
  const [fuAssistantState, setFuAssistantState] = useState<FuAssistantState>(
    DEFAULT_FU_ASSISTANT_STATE,
  );

  const hasYakuman = isYakumanSelected(gameState.selectedYaku);

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

  const setYakuWinMethod = (method: WinMethod) => {
    setGameState((prev) => ({
      ...prev,
      winMethod: method,
      selectedYaku:
        method === 'ron'
          ? prev.selectedYaku.filter((id) => id !== MENZEN_TSUMO_YAKU_ID)
          : prev.selectedYaku,
    }));
  };

  const toggleYakuNaki = () => {
    setGameState((prev) => {
      const newHasNaki = !prev.hasNaki;
      const menzenOnlyYaku = YAKU_LIST.filter((yaku) => yaku.menzenOnly).map((yaku) => yaku.id);
      return {
        ...prev,
        hasNaki: newHasNaki,
        selectedYaku: newHasNaki
          ? prev.selectedYaku.filter((id) => !menzenOnlyYaku.includes(id))
          : prev.selectedYaku,
      };
    });
  };

  const resetYakuMode = () => {
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

  const yakuScore = useMemo(() => calculateScore(gameState), [gameState]);
  const yakuWarning =
    !yakuScore && gameState.doraCount > 0 && !hasYaku(gameState)
      ? {
          title: '役がありません',
          detail: 'ドラは役ではないため、ドラだけではアガれません。役を1つ以上選んでください。',
        }
      : null;

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

  const manualError = useMemo(() => {
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

  const manualScore = useMemo(() => {
    if (manualState.han == null || manualState.fu == null || manualError) {
      return null;
    }

    return calculateScoreFromHanFu({
      han: manualState.han,
      fu: manualState.fu,
      isOya: manualState.isOya,
      winMethod: manualState.winMethod,
    });
  }, [manualState, manualError]);

  const updateManualState = <K extends keyof ManualState>(key: K, value: ManualState[K]) => {
    setManualState((prev) => ({
      ...prev,
      [key]: value,
    }));
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

  const resetManualMode = () => {
    setManualState(DEFAULT_MANUAL_STATE);
    setFuAssistantState(DEFAULT_FU_ASSISTANT_STATE);
    setHasTouchedFuAssistant(false);
  };

  const resetFuAssistant = () => {
    setFuAssistantState(DEFAULT_FU_ASSISTANT_STATE);
    setHasTouchedFuAssistant(false);
  };

  const isYakuDisabled = (yakuId: string) => {
    const yaku = YAKU_LIST.find((item) => item.id === yakuId);
    if (!yaku) return false;
    if (gameState.selectedYaku.includes(yakuId)) return false;
    if (yaku.menzenOnly && gameState.hasNaki) return true;
    if (yakuId === MENZEN_TSUMO_YAKU_ID && gameState.winMethod === 'ron') return true;
    if (hasYakuman && yakuId !== YAKUMAN_YAKU_ID) return true;
    return isIncompatibleWithSelected(yakuId, gameState.selectedYaku);
  };

  const currentScore = mode === 'manual' ? manualScore : yakuScore;
  const currentWinMethod = mode === 'manual' ? manualState.winMethod : gameState.winMethod;
  const currentWarning =
    mode === 'manual'
      ? manualError
        ? { title: 'この翻数・符の組み合わせはありません', detail: manualError }
        : null
      : yakuWarning;
  const pageBackgroundClass =
    topTab === 'records'
      ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
      : mode === 'manual'
        ? 'bg-gradient-to-br from-[#2D71E2] via-[#245fc2] to-[#1d4fa1]'
        : 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950';
  const headerSubTextClass =
    topTab === 'records'
      ? 'text-white/70'
      : mode === 'manual'
        ? 'text-blue-100/90'
        : 'text-emerald-200';
  const footerTextClass =
    topTab === 'records'
      ? 'text-white/60'
      : mode === 'manual'
        ? 'text-blue-100/80'
        : 'text-emerald-300';

  const renderScore = (variant: 'yaku' | 'manual') =>
    currentScore ? (
      <ScoreDisplay score={currentScore} winMethod={currentWinMethod} variant={variant} />
    ) : (
      <EmptyScoreCard mode={mode} warning={currentWarning} />
    );

  const yakuSectionProps = {
    selectedYaku: gameState.selectedYaku,
    hasNaki: gameState.hasNaki,
    isYakuDisabled,
    onToggleYaku: toggleYaku,
  };

  return (
    <div className={`min-h-screen ${pageBackgroundClass}`}>
      <div className="container mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <header className="relative mb-6 sm:mb-8">
          <div className="absolute right-0 top-0 z-10">
            <AuthButton />
          </div>
          <div className="pr-28 text-left sm:pr-0 sm:text-center">
            <div className="mb-2 flex items-center justify-start gap-2 sm:justify-center sm:gap-3">
              <Calculator className="h-8 w-8 text-amber-400 sm:h-10 sm:w-10" />
              <h1 className="text-2xl font-bold text-white sm:text-4xl md:text-5xl">麻雀点数ナビ</h1>
            </div>
            <p className={`text-sm md:text-base ${headerSubTextClass}`}>
              役からでも、翻数と符からでも、すぐに点数を確認。
            </p>
          </div>
        </header>

        <TopTabs active={topTab} onChange={setTopTab} />

        {topTab === 'records' ? (
          <Suspense
            fallback={<p className="py-12 text-center text-sm text-white/70">読み込み中…</p>}
          >
            <RecordsView />
          </Suspense>
        ) : (
        <>
        <ModeTabs activeMode={mode} onChange={setMode} />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {mode === 'yaku' ? (
              <>
                <div className="flex flex-col gap-6 lg:flex-row">
                  <YakuModeControls
                    gameState={gameState}
                    onWinMethodChange={setYakuWinMethod}
                    onToggleNaki={toggleYakuNaki}
                    onToggleOya={() => setGameState((prev) => ({ ...prev, isOya: !prev.isOya }))}
                    onReset={resetYakuMode}
                  />

                  <div className="min-w-0 flex-1 lg:hidden">{renderScore('yaku')}</div>
                </div>

                <YakuSection
                  {...yakuSectionProps}
                  rankLabel="S"
                  rankBadgeClass="bg-amber-500"
                  title="頻出役"
                  yakuList={S_RANK_YAKU}
                  insertBefore={{
                    index: 2,
                    node: (
                      <DoraCounter
                        count={gameState.doraCount}
                        max={MAX_DORA}
                        onIncrement={incrementDora}
                        onDecrement={decrementDora}
                      />
                    ),
                  }}
                />
                <YakuSection
                  {...yakuSectionProps}
                  rankLabel="A"
                  rankBadgeClass="bg-blue-500"
                  title="中級役"
                  yakuList={A_RANK_YAKU}
                />
                <YakuSection
                  {...yakuSectionProps}
                  rankLabel="B"
                  rankBadgeClass="bg-green-500"
                  title="上級役"
                  yakuList={B_RANK_YAKU}
                />
                <YakuSection
                  {...yakuSectionProps}
                  rankLabel="C"
                  rankBadgeClass="bg-red-500"
                  title="役満"
                  yakuList={C_RANK_YAKU}
                  singleColumn
                />
              </>
            ) : (
              <>
                <ManualScoreForm
                  manualState={manualState}
                  onWinMethodChange={(method) => updateManualState('winMethod', method)}
                  onToggleNaki={() => updateManualState('hasNaki', !manualState.hasNaki)}
                  onToggleOya={() => updateManualState('isOya', !manualState.isOya)}
                  onHanChange={(han) => updateManualState('han', han)}
                  onFuChange={(fu) => {
                    updateManualState('fu', fu);
                    updateManualState('fuSource', 'manual');
                  }}
                  onReset={resetManualMode}
                />

                <div className="lg:hidden">{renderScore('manual')}</div>

                <FuAssistant
                  state={fuAssistantState}
                  result={fuAssistantResult}
                  hasNaki={manualState.hasNaki}
                  winMethod={manualState.winMethod}
                  han={manualState.han}
                  onChange={updateFuAssistantState}
                  onReset={resetFuAssistant}
                />
              </>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 hidden lg:block">
              {renderScore(mode)}

              {mode === 'yaku' && <SelectedYakuSummary gameState={gameState} />}

              {mode === 'manual' && <ManualStatusPanel manualState={manualState} />}
            </div>
          </div>
        </div>
        </>
        )}

        <footer className={`mt-12 text-center text-sm ${footerTextClass}`}>
          <p>初心者向け麻雀点数計算ツール</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
