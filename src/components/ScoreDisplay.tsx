import React from 'react';
import { ScoreResult } from '../types/mahjong';

interface ScoreDisplayProps {
  score: ScoreResult;
  winMethod: 'tsumo' | 'ron';
  variant?: 'yaku' | 'manual';
}

function PaymentRow({ label, value, isManual }: { label: string; value: string; isManual: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-white">{label}</span>
      <span
        className={`text-right font-mono text-xl font-bold sm:text-2xl ${
          isManual ? 'text-white' : 'text-amber-300'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  winMethod,
  variant = 'yaku',
}) => {
  const isManual = variant === 'manual';

  return (
    <div
      className={`rounded-2xl border-4 p-4 shadow-2xl sm:p-6 ${
        isManual
          ? 'border-blue-300 bg-gradient-to-br from-[#255fbe] to-[#163d86]'
          : 'border-amber-500 bg-gradient-to-br from-emerald-900 to-emerald-950'
      }`}
    >
      <div className="mb-4 text-center">
        <p className={`mb-1 text-sm font-medium ${isManual ? 'text-blue-100' : 'text-amber-400'}`}>
          {score.scoreName}
        </p>
        <p className={`text-xs ${isManual ? 'text-blue-100/75' : 'text-gray-400'}`}>
          {score.totalHan}翻 {score.fu}符
        </p>
      </div>

      {winMethod === 'tsumo' && score.koPay !== undefined ? (
        <div className="space-y-3">
          <div className={`rounded-lg p-4 backdrop-blur-sm ${isManual ? 'bg-blue-950/30' : 'bg-black/30'}`}>
            <p className={`mb-2 text-sm font-medium ${isManual ? 'text-blue-100' : 'text-amber-400'}`}>
              ツモ支払い
            </p>
            {score.isOya ? (
              <PaymentRow label="子（全員）" value={`${score.koPay.toLocaleString()}点オール`} isManual={isManual} />
            ) : (
              <>
                {score.oyaPay !== undefined && (
                  <PaymentRow label="親" value={`${score.oyaPay.toLocaleString()}点`} isManual={isManual} />
                )}
                <div className="mt-2">
                  <PaymentRow label="子" value={`${score.koPay.toLocaleString()}点`} isManual={isManual} />
                </div>
              </>
            )}
          </div>
          <div
            className={`rounded-lg p-3 ${
              isManual
                ? 'border border-blue-300/50 bg-blue-300/15'
                : 'border border-amber-500/50 bg-amber-500/20'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`text-sm ${isManual ? 'text-blue-100' : 'text-amber-200'}`}>
                総支払い
              </span>
              <span
                className={`text-right font-mono text-2xl font-bold sm:text-3xl ${
                  isManual ? 'text-white' : 'text-amber-100'
                }`}
              >
                {score.totalPay.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-lg p-4 sm:p-6 ${
            isManual
              ? 'border border-blue-300/50 bg-blue-300/15'
              : 'border border-amber-500/50 bg-amber-500/20'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className={`text-lg ${isManual ? 'text-blue-100' : 'text-amber-200'}`}>
              ロン点数
            </span>
            <span
              className={`text-right font-mono text-3xl font-bold sm:text-4xl ${
                isManual ? 'text-white' : 'text-amber-100'
              }`}
            >
              {score.totalPay.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {!isManual && (
        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
          ※ 符は代表値（門前ロン40符・平和ツモ20符・七対子25符・その他30符）で計算しています。正確な符で計算したいときはマニュアルモードを使ってください。
        </p>
      )}
    </div>
  );
};
