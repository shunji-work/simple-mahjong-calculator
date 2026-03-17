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
  const isKuisagariActive = hasNaki && !!yaku.kuisagari;

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
      <div className="flex justify-between items-center gap-2">
        <span className="text-left text-sm md:text-base">{yaku.name}</span>
        <span
          className={`
            inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border
            ${
              isKuisagariActive
                ? 'bg-red-500/20 text-red-200 border-red-400 animate-pulse'
                : 'bg-white/15 text-amber-100 border-amber-300/60'
            }
          `}
        >
          <span className="font-mono text-sm">{displayHan}翻</span>
          {isKuisagariActive && (
            <span className="text-[10px] tracking-tight">食い下がり</span>
          )}
        </span>
      </div>
    </button>
  );
};
