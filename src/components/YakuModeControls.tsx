import React from 'react';
import { RotateCcw } from 'lucide-react';
import { GameState, WinMethod } from '../types/mahjong';

interface YakuModeControlsProps {
  gameState: GameState;
  onWinMethodChange: (method: WinMethod) => void;
  onToggleNaki: () => void;
  onToggleOya: () => void;
  onReset: () => void;
}

export const YakuModeControls: React.FC<YakuModeControlsProps> = ({
  gameState,
  onWinMethodChange,
  onToggleNaki,
  onToggleOya,
  onReset,
}) => (
    <div className="flex-1 rounded-xl border border-emerald-700 bg-emerald-800/50 p-4 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6">
        <button
          onClick={() => onWinMethodChange('tsumo')}
          className={`w-full rounded-lg px-4 py-3 text-base font-bold transition-all duration-200 sm:px-6 sm:text-lg ${
            gameState.winMethod === 'tsumo'
              ? 'scale-[1.02] border-2 border-rose-300 bg-rose-200 text-rose-950 shadow-lg'
              : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
          }`}
        >
          ツモ
        </button>
        <button
          onClick={() => onWinMethodChange('ron')}
          className={`w-full rounded-lg px-4 py-3 text-base font-bold transition-all duration-200 sm:px-6 sm:text-lg ${
            gameState.winMethod === 'ron'
              ? 'scale-[1.02] border-2 border-red-700 bg-red-600 text-white shadow-lg'
              : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
          }`}
        >
          ロン
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          onClick={onToggleNaki}
          className={`col-span-2 rounded-lg px-4 py-3 font-medium transition-all duration-200 sm:col-span-1 ${
            gameState.hasNaki
              ? 'scale-[1.02] border-2 border-amber-600 bg-amber-500 text-white shadow-lg'
              : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
          }`}
        >
          {gameState.hasNaki ? '鳴きあり' : '鳴きなし（メンゼン）'}
        </button>
        <button
          onClick={onToggleOya}
          className={`rounded-lg px-4 py-3 font-medium transition-all duration-200 ${
            gameState.isOya
              ? 'border-2 border-purple-700 bg-purple-600 text-white shadow-lg'
              : 'border-2 border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
          }`}
        >
          {gameState.isOya ? '親' : '子'}
        </button>
        <button
          onClick={onReset}
          className="col-span-2 flex items-center justify-center gap-2 rounded-lg border-2 border-gray-800 bg-gray-700 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-gray-600 sm:col-span-1"
        >
          <RotateCcw className="h-4 w-4" />
          リセット
        </button>
      </div>
    </div>
);
