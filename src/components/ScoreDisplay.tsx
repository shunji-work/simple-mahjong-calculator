import React from 'react';
import { ScoreResult } from '../types/mahjong';

interface ScoreDisplayProps {
  score: ScoreResult;
  winMethod: 'tsumo' | 'ron';
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, winMethod }) => {
  return (
    <div className="rounded-2xl border-4 border-amber-500 bg-gradient-to-br from-emerald-900 to-emerald-950 p-4 shadow-2xl sm:p-6">
      <div className="mb-4 text-center">
        <p className="mb-1 text-sm font-medium text-amber-400">
          {score.scoreName}
        </p>
        <p className="text-gray-400 text-xs">
          {score.totalHan}翻 {score.fu}符
        </p>
      </div>

      {winMethod === 'tsumo' && score.oyaPay && score.koPay ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-black/30 p-4 backdrop-blur-sm">
            <p className="text-amber-400 text-sm mb-2 font-medium">支払い内訳</p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-white text-sm">親：</span>
              <span className="text-right font-mono text-xl font-bold text-amber-300 sm:text-2xl">
                {score.oyaPay.toLocaleString()}点
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-white text-sm">子：</span>
              <span className="text-right font-mono text-xl font-bold text-amber-300 sm:text-2xl">
                {score.koPay.toLocaleString()}点
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-amber-200 text-sm">合計獲得：</span>
              <span className="text-right font-mono text-2xl font-bold text-amber-100 sm:text-3xl">
                {score.ronPay.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/20 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-amber-200 text-lg">獲得点数：</span>
            <span className="text-right font-mono text-3xl font-bold text-amber-100 sm:text-4xl">
              {score.ronPay.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
