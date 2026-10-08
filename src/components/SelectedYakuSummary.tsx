import React from 'react';
import { GameState } from '../types/mahjong';
import { YAKU_LIST } from '../data/yaku';
import { getEffectiveHan, isDaisangen, MENZEN_TSUMO_YAKU_ID } from '../data/yakuRules';

interface SelectedYakuSummaryProps {
  gameState: GameState;
}

function SummaryRow({ label, han, highlight = false }: { label: string; han: string; highlight?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
        highlight ? 'border border-red-500/30 bg-red-900/30' : 'bg-emerald-900/50'
      }`}
    >
      <span className="text-sm text-white">{label}</span>
      <span className="text-xs font-bold text-amber-300">{han}</span>
    </div>
  );
}

export const SelectedYakuSummary: React.FC<SelectedYakuSummaryProps> = ({ gameState }) => {
  const { selectedYaku, hasNaki, winMethod, doraCount } = gameState;
  const visibleYaku = YAKU_LIST.filter(
    (yaku) => yaku.id !== MENZEN_TSUMO_YAKU_ID && selectedYaku.includes(yaku.id),
  );
  const isMenzenTsumo = winMethod === 'tsumo' && !hasNaki;

  if (visibleYaku.length === 0 && doraCount === 0 && !isMenzenTsumo) {
    return null;
  }

  return (
    <div className="mt-6 hidden rounded-xl border border-emerald-700 bg-emerald-800/50 p-6 shadow-xl backdrop-blur-sm lg:block">
      <h3 className="mb-3 text-sm font-bold text-amber-400">選択中の役</h3>
      <div className="space-y-2">
        {visibleYaku.map((yaku) => (
          <SummaryRow key={yaku.id} label={yaku.name} han={`${getEffectiveHan(yaku, hasNaki)}翻`} />
        ))}
        {isDaisangen(selectedYaku) && <SummaryRow label="大三元（役満）" han="役満" highlight />}
        {isMenzenTsumo && <SummaryRow label="門前清自摸和（ツモ）" han="1翻" />}
        {doraCount > 0 && <SummaryRow label="ドラ" han={`${doraCount}翻`} />}
      </div>
    </div>
  );
};
