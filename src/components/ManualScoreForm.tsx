import React from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { ManualState, WinMethod } from '../types/mahjong';

interface ManualScoreFormProps {
  manualState: ManualState;
  onWinMethodChange: (method: WinMethod) => void;
  onToggleNaki: () => void;
  onToggleOya: () => void;
  onHanChange: (han: number) => void;
  onFuChange: (fu: number) => void;
  onReset: () => void;
}

const HAN_OPTIONS = Array.from({ length: 13 }, (_, index) => index + 1);
const FU_OPTIONS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];

interface StepperFieldProps {
  label: string;
  valueLabel: string;
  helper?: string;
  onIncrement: () => void;
  onDecrement: () => void;
  incrementDisabled: boolean;
  decrementDisabled: boolean;
  testId: string;
}

function StepperField({
  label,
  valueLabel,
  helper,
  onIncrement,
  onDecrement,
  incrementDisabled,
  decrementDisabled,
  testId,
}: StepperFieldProps) {
  return (
    <div
      data-testid={testId}
      className="rounded-xl border border-blue-200/45 bg-blue-950/20 p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-blue-50">{label}</span>
        {helper ? <span className="text-xs text-blue-100/75">{helper}</span> : null}
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onDecrement}
          disabled={decrementDisabled}
          className={`flex h-11 w-11 items-center justify-center rounded-lg transition-all ${
            decrementDisabled
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <Minus className="h-5 w-5" />
        </button>
        <div className="min-w-[112px] rounded-xl border border-blue-200/40 bg-slate-100/85 px-4 py-3 text-center text-lg font-bold text-slate-900 shadow-inner">
          {valueLabel}
        </div>
        <button
          onClick={onIncrement}
          disabled={incrementDisabled}
          className={`flex h-11 w-11 items-center justify-center rounded-lg transition-all ${
            incrementDisabled
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export const ManualScoreForm: React.FC<ManualScoreFormProps> = ({
  manualState,
  onWinMethodChange,
  onToggleNaki,
  onToggleOya,
  onHanChange,
  onFuChange,
  onReset,
}) => {
  const currentHanIndex = manualState.han == null ? -1 : HAN_OPTIONS.indexOf(manualState.han);
  const currentFuIndex = manualState.fu == null ? -1 : FU_OPTIONS.indexOf(manualState.fu);

  return (
    <div className="rounded-2xl border border-blue-200/45 bg-blue-200/12 p-4 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="inline-flex rounded-full border border-blue-200/50 bg-white/12 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-blue-50">
          SCORE INPUT
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-800 bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-600"
        >
          <RotateCcw className="h-4 w-4" />
          リセット
        </button>
      </div>

      <div className="mb-5 rounded-xl border border-blue-200/45 bg-blue-950/20 px-4 py-3 text-sm text-blue-50">
        点数を直接出すための入力です。まずこちらで翻数と符を決め、必要なら下段の符計算補助を使って符だけ補完します。
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(['tsumo', 'ron'] as WinMethod[]).map((method) => (
          <button
            key={method}
            onClick={() => onWinMethodChange(method)}
            className={`rounded-lg px-4 py-3 text-base font-bold transition-all ${
              manualState.winMethod === method
                ? method === 'tsumo'
                  ? 'scale-[1.02] border-2 border-rose-300 bg-rose-200 text-rose-950 shadow-lg'
                  : 'scale-[1.02] border-2 border-red-700 bg-red-600 text-white shadow-lg'
                : 'border-2 border-blue-700 bg-blue-800 text-white hover:bg-blue-700'
            }`}
          >
            {method === 'tsumo' ? 'ツモ' : 'ロン'}
          </button>
        ))}

        <button
          onClick={onToggleNaki}
          className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
            manualState.hasNaki
              ? 'scale-[1.02] border-2 border-amber-600 bg-amber-500 text-white shadow-lg'
              : 'border-2 border-blue-700 bg-blue-800 text-white hover:bg-blue-700'
          }`}
        >
          {manualState.hasNaki ? '鳴きあり' : '鳴きなし（門前）'}
        </button>

        <button
          onClick={onToggleOya}
          className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
            manualState.isOya
              ? 'border-2 border-purple-700 bg-purple-600 text-white shadow-lg'
              : 'border-2 border-blue-700 bg-blue-800 text-white hover:bg-blue-700'
          }`}
        >
          {manualState.isOya ? '親' : '子'}
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <StepperField
          testId="manual-han-stepper"
          label="翻数"
          valueLabel={manualState.han == null ? '未選択' : `${manualState.han}翻`}
          onDecrement={() => {
            if (currentHanIndex <= 0) {
              return;
            }
            onHanChange(HAN_OPTIONS[currentHanIndex - 1]);
          }}
          onIncrement={() => {
            if (currentHanIndex < 0) {
              onHanChange(HAN_OPTIONS[0]);
              return;
            }
            if (currentHanIndex >= HAN_OPTIONS.length - 1) {
              return;
            }
            onHanChange(HAN_OPTIONS[currentHanIndex + 1]);
          }}
          decrementDisabled={currentHanIndex <= 0}
          incrementDisabled={currentHanIndex >= HAN_OPTIONS.length - 1}
        />

        <StepperField
          testId="manual-fu-stepper"
          label="符"
          helper={manualState.fuSource === 'assistant' ? '符計算補助から反映中' : '直接入力'}
          valueLabel={manualState.fu == null ? '未選択' : `${manualState.fu}符`}
          onDecrement={() => {
            if (currentFuIndex <= 0) {
              return;
            }
            onFuChange(FU_OPTIONS[currentFuIndex - 1]);
          }}
          onIncrement={() => {
            if (currentFuIndex < 0) {
              onFuChange(FU_OPTIONS[0]);
              return;
            }
            if (currentFuIndex >= FU_OPTIONS.length - 1) {
              return;
            }
            onFuChange(FU_OPTIONS[currentFuIndex + 1]);
          }}
          decrementDisabled={currentFuIndex <= 0}
          incrementDisabled={currentFuIndex >= FU_OPTIONS.length - 1}
        />
      </div>
    </div>
  );
};
