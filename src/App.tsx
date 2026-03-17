import { useState, useMemo } from 'react';
import { Calculator, RotateCcw } from 'lucide-react';
import { GameState, WinMethod } from './types/mahjong';
import { YAKU_LIST, getCategoryYaku } from './data/yaku';
import { calculateScore } from './utils/scoreCalculator';
import { YakuButton } from './components/YakuButton';
import { ScoreDisplay } from './components/ScoreDisplay';
import { DoraCounter } from './components/DoraCounter';

const YAKUHAI_IDS = new Set([
  'haku',
  'hatsu',
  'chun',
  'jikazehai',
  'bakazehai',
]);

const INCOMPATIBLE_PAIRS: Array<[string, string]> = [
  // 役牌（白/發/中/場風/自風）と両立しない役
  ...Array.from(YAKUHAI_IDS).flatMap((yakuhaiId) => ([
    [yakuhaiId, 'tanyao'],
    [yakuhaiId, 'pinfu'],
    [yakuhaiId, 'chiitoitsu'],
    [yakuhaiId, 'junchan'],
    [yakuhaiId, 'ryanpeikou'],
    [yakuhaiId, 'chinitsu'],
  ] as Array<[string, string]>)),

  // 断么九（タンヤオ）
  ['tanyao', 'ikkitsuukan'],
  ['tanyao', 'chanta'],
  ['tanyao', 'junchan'],
  ['tanyao', 'honroutou'],
  ['tanyao', 'shousangen'],
  ['tanyao', 'honitsu'],

  // 平和（ピンフ）
  ['pinfu', 'toitoihou'],
  ['pinfu', 'sanankou'],
  ['pinfu', 'sankantsu'],
  ['pinfu', 'chiitoitsu'],
  ['pinfu', 'honroutou'],
  ['pinfu', 'shousangen'],

  // 一盃口（イーペーコー）
  ['ipeikou', 'toitoihou'],
  ['ipeikou', 'sanankou'],
  ['ipeikou', 'sankantsu'],
  ['ipeikou', 'chiitoitsu'],
  ['ipeikou', 'honroutou'],
  ['ipeikou', 'ryanpeikou'],

  // 二盃口（リャンペーコー）
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

  // 三色同順（サンシキ）
  ['sanshokudoujun', 'ikkitsuukan'],
  ['sanshokudoujun', 'sanankou'],
  ['sanshokudoujun', 'sankantsu'],
  ['sanshokudoujun', 'chiitoitsu'],
  ['sanshokudoujun', 'honroutou'],
  ['sanshokudoujun', 'shousangen'],
  ['sanshokudoujun', 'honitsu'],
  ['sanshokudoujun', 'chinitsu'],

  // 一気通貫（イッキ）
  ['ikkitsuukan', 'junchan'],
  ['ikkitsuukan', 'sanankou'],
  ['ikkitsuukan', 'sankantsu'],
  ['ikkitsuukan', 'chiitoitsu'],
  ['ikkitsuukan', 'honroutou'],
  ['ikkitsuukan', 'shousangen'],
  ['ikkitsuukan', 'ryanpeikou'],

  // 混全帯幺九（チャンタ）
  ['chanta', 'chiitoitsu'],
  ['chanta', 'honroutou'],
  ['chanta', 'junchan'],
  ['chanta', 'chinitsu'],

  // 純全帯幺九（純チャン）
  ['junchan', 'chiitoitsu'],
  ['junchan', 'honroutou'],
  ['junchan', 'shousangen'],
  ['junchan', 'honitsu'],
  ['junchan', 'chanta'],

  // 七対子（チートイツ）
  ['chiitoitsu', 'toitoihou'],
  ['chiitoitsu', 'sanankou'],
  ['chiitoitsu', 'sankantsu'],
  ['chiitoitsu', 'shousangen'],

  // 対々和 / 三暗刻 / 三槓子（刻子寄り）
  ['toitoihou', 'sanshokudoujun'],
  ['toitoihou', 'ikkitsuukan'],
  ['sanankou', 'sanshokudoujun'],
  ['sanankou', 'ikkitsuukan'],
  ['sankantsu', 'sanshokudoujun'],
  ['sankantsu', 'ikkitsuukan'],

  // 小三元（ショウサンゲン）
  ['shousangen', 'chinitsu'],

  // 混一色（ホンイツ）
  ['honitsu', 'chinitsu'],

  // 清一色（チンイツ）
  ['chinitsu', 'honroutou'],
];

function buildIncompatibleMap(pairs: Array<[string, string]>): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!map.has(a)) map.set(a, new Set());
    map.get(a)!.add(b);
  };
  pairs.forEach(([a, b]) => {
    add(a, b);
    add(b, a);
  });
  return map;
}

const INCOMPATIBLE_MAP = buildIncompatibleMap(INCOMPATIBLE_PAIRS);

function App() {
  const [gameState, setGameState] = useState<GameState>({
    selectedYaku: [],
    doraCount: 0,
    winMethod: 'tsumo',
    hasNaki: false,
    isOya: false,
  });

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

  const setWinMethod = (method: WinMethod) => {
    setGameState((prev) => {
      const newState = { ...prev, winMethod: method };
      if (method === 'ron' && prev.selectedYaku.includes('tsumo')) {
        newState.selectedYaku = prev.selectedYaku.filter((id) => id !== 'tsumo');
      }
      return newState;
    });
  };

  const toggleNaki = () => {
    setGameState((prev) => {
      const newHasNaki = !prev.hasNaki;
      const menzenOnlyYaku = YAKU_LIST.filter((y) => y.menzenOnly).map((y) => y.id);
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

  const toggleOya = () => {
    setGameState((prev) => ({
      ...prev,
      isOya: !prev.isOya,
    }));
  };

  const resetAll = () => {
    setGameState({
      selectedYaku: [],
      doraCount: 0,
      winMethod: 'tsumo',
      hasNaki: false,
      isOya: false,
    });
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

  const score = useMemo(() => {
    return calculateScore(gameState);
  }, [gameState]);

  const isYakuDisabled = (yakuId: string) => {
    const yaku = YAKU_LIST.find((y) => y.id === yakuId);
    if (!yaku) return false;
    if (yaku.menzenOnly && gameState.hasNaki) return true;
    if (yakuId === 'tsumo' && gameState.winMethod === 'ron') return true;
    if (hasYakuman && !gameState.selectedYaku.includes(yakuId) && yakuId !== 'yakuman') return true;
    if (!gameState.selectedYaku.includes(yakuId) && isIncompatibleWithSelected(yakuId, gameState.selectedYaku)) {
      return true;
    }
    return false;
  };

  const sRankYaku = getCategoryYaku('S');
  const aRankYaku = getCategoryYaku('A');
  const bRankYaku = getCategoryYaku('B');
  const cRankYaku = getCategoryYaku('C');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Calculator className="w-10 h-10 text-amber-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              麻雀点数ナビ
            </h1>
          </div>
          <p className="text-emerald-200 text-sm md:text-base">
            役を選ぶだけで点数を自動計算
          </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="bg-emerald-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-emerald-700 flex-1">
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={() => setWinMethod('tsumo')}
                    className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                      gameState.winMethod === 'tsumo'
                        ? 'bg-amber-500 text-white shadow-lg scale-105 border-2 border-amber-600'
                        : 'bg-emerald-700 text-white hover:bg-emerald-600 border-2 border-emerald-800'
                    }`}
                  >
                    ツモ
                  </button>
                  <button
                    onClick={() => setWinMethod('ron')}
                    className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                      gameState.winMethod === 'ron'
                        ? 'bg-amber-500 text-white shadow-lg scale-105 border-2 border-amber-600'
                        : 'bg-emerald-700 text-white hover:bg-emerald-600 border-2 border-emerald-800'
                    }`}
                  >
                    ロン
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={toggleNaki}
                    className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      gameState.hasNaki
                        ? 'bg-red-600 text-white shadow-lg border-2 border-red-700'
                        : 'bg-emerald-700 text-white hover:bg-emerald-600 border-2 border-emerald-800'
                    }`}
                  >
                    {gameState.hasNaki ? '鳴きあり' : '鳴きなし（メンゼン）'}
                  </button>
                  <button
                    onClick={toggleOya}
                    className={`flex-1 min-w-[100px] px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      gameState.isOya
                        ? 'bg-purple-600 text-white shadow-lg border-2 border-purple-700'
                        : 'bg-emerald-700 text-white hover:bg-emerald-600 border-2 border-emerald-800'
                    }`}
                  >
                    {gameState.isOya ? '親' : '子'}
                  </button>
                  <button
                    onClick={resetAll}
                    className="px-4 py-3 rounded-lg font-medium bg-gray-700 text-white hover:bg-gray-600 transition-all duration-200 border-2 border-gray-800 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    リセット
                  </button>
                </div>
              </div>

              <div className="lg:hidden flex-1 min-w-0">
                {score ? (
                  <ScoreDisplay score={score} winMethod={gameState.winMethod} />
                ) : (
                  <div className="bg-emerald-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-emerald-700 text-center h-full flex flex-col items-center justify-center">
                    <Calculator className="w-12 h-12 text-emerald-600 mb-3" />
                    <p className="text-emerald-300 text-sm">
                      役を選択してください
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-emerald-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-emerald-700">
              <h2 className="text-amber-400 text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm">S</span>
                頻出役
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="bg-emerald-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-emerald-700">
              <h2 className="text-amber-400 text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">A</span>
                中級役
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="bg-emerald-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-emerald-700">
              <h2 className="text-amber-400 text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">B</span>
                上級役
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div className="bg-emerald-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-emerald-700">
              <h2 className="text-amber-400 text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">C</span>
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
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 hidden lg:block">
              {score ? (
                <ScoreDisplay score={score} winMethod={gameState.winMethod} />
              ) : (
                <div className="bg-emerald-800/50 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-emerald-700 text-center">
                  <Calculator className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                  <p className="text-emerald-300 text-lg">
                    役を選択してください
                  </p>
                  <p className="text-emerald-400 text-sm mt-2">
                    あがり方と役を選ぶと自動で点数を計算します
                  </p>
                </div>
              )}

              {(gameState.selectedYaku.length > 0 || gameState.doraCount > 0 || (gameState.winMethod === 'tsumo' && !gameState.hasNaki)) && (
                <div className="mt-6 bg-emerald-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-emerald-700 hidden lg:block">
                  <h3 className="text-amber-400 font-bold mb-3 text-sm">選択中の役</h3>
                  <div className="space-y-2">
                    {gameState.selectedYaku.map((yakuId) => {
                      const yaku = YAKU_LIST.find((y) => y.id === yakuId);
                      const displayHan = gameState.hasNaki && yaku?.kuisagari ? (yaku.han - 1) : yaku?.han;
                      return (
                        <div
                          key={yakuId}
                          className="flex justify-between items-center bg-emerald-900/50 rounded-lg px-3 py-2"
                        >
                          <span className="text-white text-sm">{yaku?.name}</span>
                          <span className="text-amber-300 text-xs font-bold">
                            {displayHan}翻
                          </span>
                        </div>
                      );
                    })}
                    {hasDaisangen && (
                      <div className="flex justify-between items-center bg-red-900/30 rounded-lg px-3 py-2 border border-red-500/30">
                        <span className="text-white text-sm">大三元（役満）</span>
                        <span className="text-amber-300 text-xs font-bold">役満</span>
                      </div>
                    )}
                    {gameState.winMethod === 'tsumo' && !gameState.hasNaki && !gameState.selectedYaku.includes('tsumo') && (
                      <div className="flex justify-between items-center bg-emerald-900/50 rounded-lg px-3 py-2">
                        <span className="text-white text-sm">門前清自摸和（ツモ）</span>
                        <span className="text-amber-300 text-xs font-bold">1翻</span>
                      </div>
                    )}
                    {gameState.doraCount > 0 && (
                      <div className="flex justify-between items-center bg-emerald-900/50 rounded-lg px-3 py-2">
                        <span className="text-white text-sm">ドラ</span>
                        <span className="text-amber-300 text-xs font-bold">
                          {gameState.doraCount}翻
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-emerald-300 text-sm">
          <p>初心者向け麻雀点数計算ツール</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
