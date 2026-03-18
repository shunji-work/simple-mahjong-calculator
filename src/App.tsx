import { useEffect, useMemo, useState } from 'react';
import { Calculator, RotateCcw } from 'lucide-react';
import {
  AppMode,
  FuAssistantState,
  GameState,
  ManualState,
  WinMethod,
} from './types/mahjong';
import { YAKU_LIST, getCategoryYaku } from './data/yaku';
import {
  calculateFuFromAssistant,
  calculateScore,
  calculateScoreFromHanFu,
  isFuAssistantApplicable,
  sanitizeFuAssistantState,
} from './utils/scoreCalculator';
import { YakuButton } from './components/YakuButton';
import { ScoreDisplay } from './components/ScoreDisplay';
import { DoraCounter } from './components/DoraCounter';
import { ModeTabs } from './components/ModeTabs';
import { ManualScoreForm } from './components/ManualScoreForm';
import { FuAssistant } from './components/FuAssistant';

const YAKUHAI_IDS = new Set([
  'haku',
  'hatsu',
  'chun',
  'jikazehai',
  'bakazehai',
]);

const INCOMPATIBLE_PAIRS: Array<[string, string]> = [
  ...Array.from(YAKUHAI_IDS).flatMap(
    (yakuhaiId) =>
      ([
        [yakuhaiId, 'tanyao'],
        [yakuhaiId, 'pinfu'],
        [yakuhaiId, 'chiitoitsu'],
        [yakuhaiId, 'junchan'],
        [yakuhaiId, 'ryanpeikou'],
        [yakuhaiId, 'chinitsu'],
      ] as Array<[string, string]>),
  ),
  ['tanyao', 'ikkitsuukan'],
  ['tanyao', 'chanta'],
  ['tanyao', 'junchan'],
  ['tanyao', 'honroutou'],
  ['tanyao', 'shousangen'],
  ['tanyao', 'honitsu'],
  ['pinfu', 'toitoihou'],
  ['pinfu', 'sanankou'],
  ['pinfu', 'sankantsu'],
  ['pinfu', 'chiitoitsu'],
  ['pinfu', 'honroutou'],
  ['pinfu', 'shousangen'],
  ['ipeikou', 'toitoihou'],
  ['ipeikou', 'sanankou'],
  ['ipeikou', 'sankantsu'],
  ['ipeikou', 'chiitoitsu'],
  ['ipeikou', 'honroutou'],
  ['ipeikou', 'ryanpeikou'],
  ['ryanpeikou', 'sanshokudoujun'],
  ['ryanpeikou', 'ikkitsuukan'],
  ['ryanpeikou', 'toitoihou'],
  ['ryanpeikou', 'sanankou'],
  ['ryanpeikou', 'sankantsu'],
  ['ryanpeikou', 'chiitoitsu'],
  ['ryanpeikou', 'honroutou'],
  ['ryanpeikou', 'shousangen'],
  ['ryanpeikou', 'honitsu'],
  ['ryanpeikou', 'chinitsu'],
  ['ryanpeikou', 'ipeikou'],
  ['sanshokudoujun', 'ikkitsuukan'],
  ['sanshokudoujun', 'sanankou'],
  ['sanshokudoujun', 'sankantsu'],
  ['sanshokudoujun', 'chiitoitsu'],
  ['sanshokudoujun', 'honroutou'],
  ['sanshokudoujun', 'shousangen'],
  ['sanshokudoujun', 'honitsu'],
  ['sanshokudoujun', 'chinitsu'],
  ['ikkitsuukan', 'junchan'],
  ['ikkitsuukan', 'sanankou'],
  ['ikkitsuukan', 'sankantsu'],
  ['ikkitsuukan', 'chiitoitsu'],
  ['ikkitsuukan', 'honroutou'],
  ['ikkitsuukan', 'shousangen'],
  ['ikkitsuukan', 'ryanpeikou'],
  ['chanta', 'chiitoitsu'],
  ['chanta', 'honroutou'],
  ['chanta', 'junchan'],
  ['chanta', 'chinitsu'],
  ['junchan', 'chiitoitsu'],
  ['junchan', 'honroutou'],
  ['junchan', 'shousangen'],
  ['junchan', 'honitsu'],
  ['junchan', 'chanta'],
  ['chiitoitsu', 'toitoihou'],
  ['chiitoitsu', 'sanankou'],
  ['chiitoitsu', 'sankantsu'],
  ['chiitoitsu', 'shousangen'],
  ['toitoihou', 'sanshokudoujun'],
  ['toitoihou', 'ikkitsuukan'],
  ['sanankou', 'sanshokudoujun'],
  ['sanankou', 'ikkitsuukan'],
  ['sankantsu', 'sanshokudoujun'],
  ['sankantsu', 'ikkitsuukan'],
  ['shousangen', 'chinitsu'],
  ['honitsu', 'chinitsu'],
  ['chinitsu', 'honroutou'],
];

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

function buildIncompatibleMap(pairs: Array<[string, string]>): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!map.has(a)) {
      map.set(a, new Set());
    }
    map.get(a)?.add(b);
  };

  pairs.forEach(([a, b]) => {
    add(a, b);
    add(b, a);
  });

  return map;
}

const INCOMPATIBLE_MAP = buildIncompatibleMap(INCOMPATIBLE_PAIRS);

function EmptyScoreCard({ mode }: { mode: AppMode }) {
  return (
    <div className="rounded-xl border border-emerald-700 bg-emerald-800/50 p-8 text-center shadow-xl backdrop-blur-sm">
      <Calculator className="mx-auto mb-4 h-16 w-16 text-emerald-600" />
      <p className="text-lg text-emerald-200">
        {mode === 'manual' ? '翻数と符を入力してください' : '役を選択してください'}
      </p>
      <p className="mt-2 text-sm text-emerald-400">
        {mode === 'manual'
          ? '下段の符計算補助を使うと、上段の符へ自動反映されます'
          : 'あがり方と役を選ぶと自動で点数を計算します'}
      </p>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<AppMode>('yaku');
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [manualState, setManualState] = useState<ManualState>(DEFAULT_MANUAL_STATE);
  const [fuAssistantState, setFuAssistantState] = useState<FuAssistantState>(
    DEFAULT_FU_ASSISTANT_STATE,
  );

  const hasDaisangen =
    gameState.selectedYaku.includes('haku') &&
    gameState.selectedYaku.includes('hatsu') &&
    gameState.selectedYaku.includes('chun');

  const hasYakuman = gameState.selectedYaku.includes('yakuman') || hasDaisangen;

  const isIncompatibleWithSelected = (yakuId: string, selectedYaku: string[]) => {
    const incompatible = INCOMPATIBLE_MAP.get(yakuId);
    if (!incompatible) return false;
    return selectedYaku.some((selectedId) => incompatible.has(selectedId));
  };

  const toggleYaku = (yakuId: string) => {
    setGameState((prev) => ({
      ...prev,
      selectedYaku: prev.selectedYaku.includes(yakuId)
        ? prev.selectedYaku.filter((id) => id !== yakuId)
        : (() => {
            if (yakuId === 'yakuman') {
              return ['yakuman'];
            }
            const incompatible = INCOMPATIBLE_MAP.get(yakuId) ?? new Set<string>();
            const cleaned = prev.selectedYaku.filter((id) => !incompatible.has(id));
            return [...cleaned, yakuId];
          })(),
    }));
  };

  const setYakuWinMethod = (method: WinMethod) => {
    setGameState((prev) => {
      const newState = { ...prev, winMethod: method };
      if (method === 'ron' && prev.selectedYaku.includes('tsumo')) {
        newState.selectedYaku = prev.selectedYaku.filter((id) => id !== 'tsumo');
      }
      return newState;
    });
  };

  const toggleYakuNaki = () => {
    setGameState((prev) => {
      const newHasNaki = !prev.hasNaki;
      const menzenOnlyYaku = YAKU_LIST.filter((yaku) => yaku.menzenOnly).map((yaku) => yaku.id);
      const newSelectedYaku = newHasNaki
        ? prev.selectedYaku.filter((id) => !menzenOnlyYaku.includes(id))
        : prev.selectedYaku;

      return {
        ...prev,
        hasNaki: newHasNaki,
        selectedYaku: newSelectedYaku,
      };
    });
  };

  const resetYakuMode = () => {
    setGameState(DEFAULT_GAME_STATE);
  };

  const incrementDora = () => {
    setGameState((prev) => ({
      ...prev,
      doraCount: prev.doraCount + 1,
    }));
  };

  const decrementDora = () => {
    setGameState((prev) => ({
      ...prev,
      doraCount: Math.max(0, prev.doraCount - 1),
    }));
  };

  const yakuScore = useMemo(() => calculateScore(gameState), [gameState]);

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
  }, [fuAssistantResult]);

  useEffect(() => {
    setFuAssistantState((prev) => sanitizeFuAssistantState(prev, { hasNaki: manualState.hasNaki }));
  }, [manualState.hasNaki]);

  const manualScore = useMemo(() => {
    if (manualState.han == null || manualState.fu == null) {
      return null;
    }

    return calculateScoreFromHanFu({
      han: manualState.han,
      fu: manualState.fu,
      isOya: manualState.isOya,
      winMethod: manualState.winMethod,
    });
  }, [manualState]);

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
  };

  const resetFuAssistant = () => {
    setFuAssistantState(DEFAULT_FU_ASSISTANT_STATE);
  };

  const isYakuDisabled = (yakuId: string) => {
    const yaku = YAKU_LIST.find((item) => item.id === yakuId);
    if (!yaku) return false;
    if (yaku.menzenOnly && gameState.hasNaki) return true;
    if (yakuId === 'tsumo' && gameState.winMethod === 'ron') return true;
    if (hasYakuman && !gameState.selectedYaku.includes(yakuId) && yakuId !== 'yakuman') {
      return true;
    }
    if (
      !gameState.selectedYaku.includes(yakuId) &&
      isIncompatibleWithSelected(yakuId, gameState.selectedYaku)
    ) {
      return true;
    }
    return false;
  };

  const sRankYaku = getCategoryYaku('S');
  const aRankYaku = getCategoryYaku('A');
  const bRankYaku = getCategoryYaku('B');
  const cRankYaku = getCategoryYaku('C');
  const currentScore = mode === 'manual' ? manualScore : yakuScore;
  const currentWinMethod = mode === 'manual' ? manualState.winMethod : gameState.winMethod;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950">
      <div className="container mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <header className="mb-6 text-center sm:mb-8">
          <div className="mb-2 flex items-center justify-center gap-2 sm:gap-3">
            <Calculator className="h-8 w-8 text-amber-400 sm:h-10 sm:w-10" />
            <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">麻雀点数ナビ</h1>
          </div>
          <p className="text-sm text-emerald-200 md:text-base">
            役からでも、翻数と符からでも、すぐに点数を確認。
          </p>
        </header>

        <ModeTabs activeMode={mode} onChange={setMode} />

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {mode === 'yaku' ? (
              <>
                <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="flex-1 rounded-xl border border-emerald-700 bg-emerald-800/50 p-4 shadow-xl backdrop-blur-sm sm:p-6">
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6">
                      <button
                        onClick={() => setYakuWinMethod('tsumo')}
                        className={`w-full rounded-lg px-4 py-3 text-base font-bold transition-all duration-200 sm:px-6 sm:text-lg ${
                          gameState.winMethod === 'tsumo'
                            ? 'scale-105 border-2 border-amber-600 bg-amber-500 text-white shadow-lg'
                            : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
                        }`}
                      >
                        ツモ
                      </button>
                      <button
                        onClick={() => setYakuWinMethod('ron')}
                        className={`w-full rounded-lg px-4 py-3 text-base font-bold transition-all duration-200 sm:px-6 sm:text-lg ${
                          gameState.winMethod === 'ron'
                            ? 'scale-105 border-2 border-amber-600 bg-amber-500 text-white shadow-lg'
                            : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
                        }`}
                      >
                        ロン
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <button
                        onClick={toggleYakuNaki}
                        className={`col-span-2 rounded-lg px-4 py-3 font-medium transition-all duration-200 sm:col-span-1 ${
                          gameState.hasNaki
                            ? 'border-2 border-red-700 bg-red-600 text-white shadow-lg'
                            : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
                        }`}
                      >
                        {gameState.hasNaki ? '鳴きあり' : '鳴きなし（メンゼン）'}
                      </button>
                      <button
                        onClick={() =>
                          setGameState((prev) => ({
                            ...prev,
                            isOya: !prev.isOya,
                          }))
                        }
                        className={`rounded-lg px-4 py-3 font-medium transition-all duration-200 ${
                          gameState.isOya
                            ? 'border-2 border-purple-700 bg-purple-600 text-white shadow-lg'
                            : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
                        }`}
                      >
                        {gameState.isOya ? '親' : '子'}
                      </button>
                      <button
                        onClick={resetYakuMode}
                        className="col-span-2 flex items-center justify-center gap-2 rounded-lg border-2 border-gray-800 bg-gray-700 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-gray-600 sm:col-span-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                        リセット
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 lg:hidden">
                    {currentScore ? (
                      <ScoreDisplay score={currentScore} winMethod={currentWinMethod} />
                    ) : (
                      <EmptyScoreCard mode={mode} />
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-700 bg-emerald-800/50 p-4 shadow-xl backdrop-blur-sm sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-400 sm:text-xl">
                    <span className="rounded-full bg-amber-500 px-3 py-1 text-sm text-white">S</span>
                    頻出役
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {sRankYaku.slice(0, 2).map((yaku) => (
                      <YakuButton
                        key={yaku.id}
                        yaku={yaku}
                        isSelected={gameState.selectedYaku.includes(yaku.id)}
                        isDisabled={isYakuDisabled(yaku.id)}
                        onClick={() => toggleYaku(yaku.id)}
                        hasNaki={gameState.hasNaki}
                      />
                    ))}
                    <div className="sm:col-span-2">
                      <DoraCounter
                        count={gameState.doraCount}
                        onIncrement={incrementDora}
                        onDecrement={decrementDora}
                      />
                    </div>
                    {sRankYaku.slice(2).map((yaku) => (
                      <YakuButton
                        key={yaku.id}
                        yaku={yaku}
                        isSelected={gameState.selectedYaku.includes(yaku.id)}
                        isDisabled={isYakuDisabled(yaku.id)}
                        onClick={() => toggleYaku(yaku.id)}
                        hasNaki={gameState.hasNaki}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-700 bg-emerald-800/50 p-4 shadow-xl backdrop-blur-sm sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-400 sm:text-xl">
                    <span className="rounded-full bg-blue-500 px-3 py-1 text-sm text-white">A</span>
                    中級役
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {aRankYaku.map((yaku) => (
                      <YakuButton
                        key={yaku.id}
                        yaku={yaku}
                        isSelected={gameState.selectedYaku.includes(yaku.id)}
                        isDisabled={isYakuDisabled(yaku.id)}
                        onClick={() => toggleYaku(yaku.id)}
                        hasNaki={gameState.hasNaki}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-700 bg-emerald-800/50 p-4 shadow-xl backdrop-blur-sm sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-400 sm:text-xl">
                    <span className="rounded-full bg-green-500 px-3 py-1 text-sm text-white">B</span>
                    上級役
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {bRankYaku.map((yaku) => (
                      <YakuButton
                        key={yaku.id}
                        yaku={yaku}
                        isSelected={gameState.selectedYaku.includes(yaku.id)}
                        isDisabled={isYakuDisabled(yaku.id)}
                        onClick={() => toggleYaku(yaku.id)}
                        hasNaki={gameState.hasNaki}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-700 bg-emerald-800/50 p-4 shadow-xl backdrop-blur-sm sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-400 sm:text-xl">
                    <span className="rounded-full bg-red-500 px-3 py-1 text-sm text-white">C</span>
                    役満
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {cRankYaku.map((yaku) => (
                      <YakuButton
                        key={yaku.id}
                        yaku={yaku}
                        isSelected={gameState.selectedYaku.includes(yaku.id)}
                        isDisabled={isYakuDisabled(yaku.id)}
                        onClick={() => toggleYaku(yaku.id)}
                        hasNaki={gameState.hasNaki}
                      />
                    ))}
                  </div>
                </div>
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

                <div className="lg:hidden">
                  {currentScore ? (
                    <ScoreDisplay score={currentScore} winMethod={currentWinMethod} />
                  ) : (
                    <EmptyScoreCard mode={mode} />
                  )}
                </div>

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
              {currentScore ? (
                <ScoreDisplay score={currentScore} winMethod={currentWinMethod} />
              ) : (
                <EmptyScoreCard mode={mode} />
              )}

              {mode === 'yaku' &&
                (gameState.selectedYaku.length > 0 ||
                  gameState.doraCount > 0 ||
                  (gameState.winMethod === 'tsumo' && !gameState.hasNaki)) && (
                  <div className="mt-6 hidden rounded-xl border border-emerald-700 bg-emerald-800/50 p-6 shadow-xl backdrop-blur-sm lg:block">
                    <h3 className="mb-3 text-sm font-bold text-amber-400">選択中の役</h3>
                    <div className="space-y-2">
                      {gameState.selectedYaku.map((yakuId) => {
                        const yaku = YAKU_LIST.find((item) => item.id === yakuId);
                        const displayHan =
                          gameState.hasNaki && yaku?.kuisagari ? yaku.han - 1 : yaku?.han;
                        return (
                          <div
                            key={yakuId}
                            className="flex items-center justify-between rounded-lg bg-emerald-900/50 px-3 py-2"
                          >
                            <span className="text-sm text-white">{yaku?.name}</span>
                            <span className="text-xs font-bold text-amber-300">{displayHan}翻</span>
                          </div>
                        );
                      })}
                      {hasDaisangen && (
                        <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-900/30 px-3 py-2">
                          <span className="text-sm text-white">大三元（役満）</span>
                          <span className="text-xs font-bold text-amber-300">役満</span>
                        </div>
                      )}
                      {gameState.winMethod === 'tsumo' &&
                        !gameState.hasNaki &&
                        !gameState.selectedYaku.includes('tsumo') && (
                          <div className="flex items-center justify-between rounded-lg bg-emerald-900/50 px-3 py-2">
                            <span className="text-sm text-white">門前清自摸和（ツモ）</span>
                            <span className="text-xs font-bold text-amber-300">1翻</span>
                          </div>
                        )}
                      {gameState.doraCount > 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-emerald-900/50 px-3 py-2">
                          <span className="text-sm text-white">ドラ</span>
                          <span className="text-xs font-bold text-amber-300">
                            {gameState.doraCount}翻
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {mode === 'manual' && (
                <div className="mt-6 rounded-xl border border-emerald-700 bg-emerald-800/50 p-6 shadow-xl backdrop-blur-sm">
                  <h3 className="mb-3 text-sm font-bold text-amber-400">マニュアル入力の状態</h3>
                  <div className="space-y-2 text-sm text-emerald-100">
                    <div className="flex items-center justify-between rounded-lg bg-emerald-900/50 px-3 py-2">
                      <span>あがり方</span>
                      <span>{manualState.winMethod === 'tsumo' ? 'ツモ' : 'ロン'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-emerald-900/50 px-3 py-2">
                      <span>状態</span>
                      <span>
                        {manualState.isOya ? '親' : '子'} /{' '}
                        {manualState.hasNaki ? '鳴きあり' : '門前'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-emerald-900/50 px-3 py-2">
                      <span>翻数</span>
                      <span>{manualState.han ? `${manualState.han}翻` : '未選択'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-emerald-900/50 px-3 py-2">
                      <span>符</span>
                      <span>
                        {manualState.fu ? `${manualState.fu}符` : '未選択'}{' '}
                        {manualState.fuSource === 'assistant' ? '（補助反映）' : '（手動）'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-emerald-300">
          <p>初心者向け麻雀点数計算ツール</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
