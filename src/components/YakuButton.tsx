import React from 'react';
import { Yaku } from '../types/mahjong';

interface YakuButtonProps {
  yaku: Yaku;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
  hasNaki?: boolean;
}

export const YakuButton: React.FC<YakuButtonProps> = ({
  yaku,
  isSelected,
  isDisabled,
  onClick,
  hasNaki = false,
}) => {
  const displayHan = hasNaki && yaku.kuisagari ? yaku.han - 1 : yaku.han;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
        ${
          isSelected
            ? 'bg-amber-500 text-white shadow-lg scale-105 border-2 border-amber-600'
            : isDisabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
            : 'bg-emerald-800 text-white hover:bg-emerald-700 hover:scale-102 border-2 border-emerald-900 shadow-md'
        }
      `}
    >
      <div className="flex justify-between items-center">
        <span className="text-left">{yaku.name}</span>
        <span className="text-xs bg-white/20 px-2 py-1 rounded">
          {displayHan}翻
          {hasNaki && yaku.kuisagari && (
            <span className="text-[10px] ml-1 opacity-75">(食い下がり)</span>
          )}
        </span>
      </div>
    </button>
  );
};
