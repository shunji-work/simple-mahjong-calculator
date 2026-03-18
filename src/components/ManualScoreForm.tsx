import React from 'react';
import { RotateCcw } from 'lucide-react';
import { ManualState, WinMethod } from '../types/mahjong';

interface ManualScoreFormProps {
  manualState: ManualState;
  onWinMethodChange: (method: WinMethod) => void;
  onToggleNaki: () => void;
  onToggleOya: () => void;
  onHanChange: (han: number) => void;
  onFuChange: (fu: number) => void;
  onReset: () => void;
}

const HAN_OPTIONS = Array.from({ length: 13 }, (_, index) => index + 1);
const FU_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

export const ManualScoreForm: React.FC<ManualScoreFormProps> = ({
  manualState,
  onWinMethodChange,
  onToggleNaki,
  onToggleOya,
  onHanChange,
  onFuChange,
  onReset,
}) => {
  return (
    <div className="rounded-xl border border-emerald-700 bg-emerald-800/50 p-4 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">翻数・符を直接入力</h2>
          <p className="mt-1 text-sm text-emerald-200">
            親子とあがり方を選び、合計翻数と最終符を指定します。
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-800 bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-600"
        >
          <RotateCcw className="h-4 w-4" />
          リセット
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-700 bg-emerald-900/50 p-4">
          <div className="mb-3 text-sm font-semibold text-emerald-200">あがり方</div>
          <div className="grid grid-cols-2 gap-3">
            {(['tsumo', 'ron'] as WinMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => onWinMethodChange(method)}
                className={`rounded-lg px-4 py-3 text-base font-bold transition-all ${
                  manualState.winMethod === method
                    ? method === 'tsumo'
                      ? 'scale-[1.02] border-2 border-rose-300 bg-rose-200 text-rose-950 shadow-lg'
                      : 'scale-[1.02] border-2 border-red-700 bg-red-600 text-white shadow-lg'
                    : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
                }`}
              >
                {method === 'tsumo' ? 'ツモ' : 'ロン'}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-700 bg-emerald-900/50 p-4">
          <div className="mb-3 text-sm font-semibold text-emerald-200">状態</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onToggleNaki}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                manualState.hasNaki
                  ? 'scale-[1.02] border-2 border-amber-600 bg-amber-500 text-white shadow-lg'
                  : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
              }`}
            >
              {manualState.hasNaki ? '鳴きあり' : '鳴きなし（メンゼン）'}
            </button>
            <button
              onClick={onToggleOya}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                manualState.isOya
                  ? 'border-2 border-purple-700 bg-purple-600 text-white'
                  : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
              }`}
            >
              {manualState.isOya ? '親' : '子'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="rounded-xl border border-emerald-700 bg-emerald-900/50 p-4">
          <div className="mb-3 text-sm font-semibold text-emerald-200">翻数</div>
          <select
            value={manualState.han ?? ''}
            onChange={(event) => onHanChange(Number(event.target.value))}
            className="w-full rounded-lg border border-emerald-600 bg-emerald-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
          >
            <option value="" disabled>
              翻数を選択
            </option>
            {HAN_OPTIONS.map((han) => (
              <option key={han} value={han}>
                {han}翻
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-xl border border-emerald-700 bg-emerald-900/50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-emerald-200">符</span>
            <span className="text-xs text-emerald-300">
              {manualState.fuSource === 'assistant' ? '下段の補助から反映中' : '手動入力'}
            </span>
          </div>
          <select
            value={manualState.fu ?? ''}
            onChange={(event) => onFuChange(Number(event.target.value))}
            className="w-full rounded-lg border border-emerald-600 bg-emerald-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
          >
            <option value="" disabled>
              符を選択
            </option>
            {FU_OPTIONS.map((fu) => (
              <option key={fu} value={fu}>
                {fu}符
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};
