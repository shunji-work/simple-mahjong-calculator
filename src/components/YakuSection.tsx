import React from 'react';
import { Yaku } from '../types/mahjong';
import { YakuButton } from './YakuButton';

interface YakuSectionProps {
  rankLabel: string;
  rankBadgeClass: string;
  title: string;
  yakuList: Yaku[];
  selectedYaku: string[];
  hasNaki: boolean;
  isYakuDisabled: (yakuId: string) => boolean;
  onToggleYaku: (yakuId: string) => void;
  singleColumn?: boolean;
  /** 指定した位置（役ボタンの index）の直前に差し込む要素。ドラカウンター用 */
  insertBefore?: { index: number; node: React.ReactNode };
}

export const YakuSection: React.FC<YakuSectionProps> = ({
  rankLabel,
  rankBadgeClass,
  title,
  yakuList,
  selectedYaku,
  hasNaki,
  isYakuDisabled,
  onToggleYaku,
  singleColumn = false,
  insertBefore,
}) => (
  <div className="rounded-xl border border-emerald-700 bg-emerald-800/50 p-4 shadow-xl backdrop-blur-sm sm:p-6">
    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-amber-400 sm:text-xl">
      <span className={`rounded-full px-3 py-1 text-sm text-white ${rankBadgeClass}`}>{rankLabel}</span>
      {title}
    </h2>
    <div className={`grid grid-cols-1 gap-3 ${singleColumn ? '' : 'sm:grid-cols-2'}`}>
      {yakuList.map((yaku, index) => (
        <React.Fragment key={yaku.id}>
          {insertBefore?.index === index && <div className="sm:col-span-2">{insertBefore.node}</div>}
          <YakuButton
            yaku={yaku}
            isSelected={selectedYaku.includes(yaku.id)}
            isDisabled={isYakuDisabled(yaku.id)}
            onClick={() => onToggleYaku(yaku.id)}
            hasNaki={hasNaki}
          />
        </React.Fragment>
      ))}
    </div>
  </div>
);
