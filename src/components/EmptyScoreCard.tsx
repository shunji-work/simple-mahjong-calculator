import React from 'react';
import { AlertTriangle, Calculator } from 'lucide-react';
import { AppMode } from '../types/mahjong';

interface EmptyScoreCardProps {
  mode: AppMode;
  /** 入力が成立しないときの警告。指定がなければ入力を促す案内を表示する */
  warning?: { title: string; detail: string } | null;
}

export const EmptyScoreCard: React.FC<EmptyScoreCardProps> = ({ mode, warning }) => {
  const isManual = mode === 'manual';
  const Icon = warning ? AlertTriangle : Calculator;

  return (
    <div
      data-testid="empty-score-card"
      className={`rounded-xl p-8 text-center shadow-xl backdrop-blur-sm ${
        isManual ? 'border border-blue-200/40 bg-blue-950/25' : 'border border-emerald-700 bg-emerald-800/50'
      }`}
    >
      <Icon
        className={`mx-auto mb-4 h-16 w-16 ${
          warning ? 'text-amber-400' : isManual ? 'text-blue-100' : 'text-emerald-600'
        }`}
      />
      <p className={`text-lg ${isManual ? 'text-white' : 'text-emerald-200'}`}>
        {warning ? warning.title : isManual ? '翻数と符を入力してください' : '役を選択してください'}
      </p>
      <p className={`mt-2 text-sm ${isManual ? 'text-blue-100/75' : 'text-emerald-400'}`}>
        {warning
          ? warning.detail
          : isManual
            ? '下段の符計算補助を使うと、上段の符へ自動反映されます'
            : 'あがり方と役を選ぶと自動で点数を計算します'}
      </p>
    </div>
  );
};
