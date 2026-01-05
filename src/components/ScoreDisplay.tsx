import React from 'react';
import { ScoreResult } from '../types/mahjong';

interface ScoreDisplayProps {
  score: ScoreResult;
  winMethod: 'tsumo' | 'ron';
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, winMethod }) => {
  return (
    <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-2xl p-6 shadow-2xl border-4 border-amber-500">
      <div className="text-center mb-4">
        <p className="text-amber-400 text-sm font-medium mb-1">
          {score.scoreName}
        </p>
        <p className="text-gray-400 text-xs">
          {score.totalHan}翻 {score.fu}符
        </p>
      </div>

      {winMethod === 'tsumo' && score.oyaPay && score.koPay ? (
        <div className="space-y-3">
          <div className="bg-black/30 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-amber-400 text-sm mb-2 font-medium">支払い内訳</p>
            <div className="flex justify-between items-center">
              <span className="text-white text-sm">親：</span>
              <span className="text-amber-300 text-2xl font-bold font-mono">
                {score.oyaPay.toLocaleString()}点
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-white text-sm">子：</span>
              <span className="text-amber-300 text-2xl font-bold font-mono">
                {score.koPay.toLocaleString()}点
              </span>
            </div>
          </div>
          <div className="bg-amber-500/20 rounded-lg p-3 border border-amber-500/50">
            <div className="flex justify-between items-center">
              <span className="text-amber-200 text-sm">合計獲得：</span>
              <span className="text-amber-100 text-3xl font-bold font-mono">
                {score.ronPay.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/20 rounded-lg p-6 border border-amber-500/50">
          <div className="flex justify-between items-center">
            <span className="text-amber-200 text-lg">獲得点数：</span>
            <span className="text-amber-100 text-4xl font-bold font-mono">
              {score.ronPay.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
