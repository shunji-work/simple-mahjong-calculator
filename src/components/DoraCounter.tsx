import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface DoraCounterProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const DoraCounter: React.FC<DoraCounterProps> = ({
  count,
  onIncrement,
  onDecrement,
}) => {
  return (
    <div className="w-full rounded-lg border-2 border-emerald-900 bg-emerald-800 p-4 shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-white font-medium text-sm mb-1">ドラ</p>
          <p className="text-emerald-300 text-xs">タップで加算</p>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <button
            onClick={onDecrement}
            disabled={count === 0}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
              count === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 shadow-md'
            }`}
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="min-w-[60px] rounded-lg bg-amber-500 px-4 py-2 text-center text-2xl font-bold text-white shadow-lg">
            {count}
          </div>

          <button
            onClick={onIncrement}
            className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-600 text-white hover:bg-green-700 hover:scale-105 transition-all duration-200 shadow-md"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {count > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-700">
          <div className="flex justify-between items-center">
            <span className="text-emerald-300 text-xs">合計翻数：</span>
            <span className="text-amber-300 text-sm font-bold">{count}翻</span>
          </div>
        </div>
      )}
    </div>
  );
};
