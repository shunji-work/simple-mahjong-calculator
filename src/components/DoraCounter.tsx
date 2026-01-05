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
    <div className="w-full bg-emerald-800 rounded-lg p-4 shadow-md border-2 border-emerald-900">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-white font-medium text-sm mb-1">ドラ</p>
          <p className="text-emerald-300 text-xs">タップで加算</p>
        </div>

        <div className="flex items-center gap-2">
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

          <div className="bg-amber-500 text-white font-bold text-2xl rounded-lg px-4 py-2 min-w-[60px] text-center shadow-lg">
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
