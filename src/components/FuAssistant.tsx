import React from 'react';
import { CounterField } from './CounterField';
import {
  FuAssistantResult,
  FuAssistantState,
  FuSpecialCase,
  WaitType,
  WinMethod,
} from '../types/mahjong';
import {
  getFuAssistantMeldCount,
  getMaxRemainingMeldSlots,
  isFuAssistantApplicable,
} from '../utils/scoreCalculator';

interface FuAssistantProps {
  state: FuAssistantState;
  result: FuAssistantResult;
  hasNaki: boolean;
  winMethod: WinMethod;
  han: number | null;
  onChange: <K extends keyof FuAssistantState>(key: K, value: FuAssistantState[K]) => void;
  onReset: () => void;
}

const WAIT_OPTIONS: Array<{ value: WaitType; label: string }> = [
  { value: 'none', label: 'なし' },
  { value: 'tanki', label: '単騎' },
  { value: 'penchan', label: 'ペンチャン' },
  { value: 'kanchan', label: 'カンチャン' },
];

const SPECIAL_CASE_OPTIONS: Array<{ value: FuSpecialCase; label: string; helper: string }> = [
  { value: 'none', label: 'なし', helper: '通常の符計算を使います。' },
  { value: 'pinfu', label: '平和', helper: 'ツモ20符 / ロン30符の固定です。' },
  { value: 'chiitoitsu', label: '七対子', helper: '25符固定です。' },
];

const COUNTER_FIELDS: Array<{
  key: keyof Pick<
    FuAssistantState,
    | 'terminalConcealedTriplets'
    | 'terminalOpenTriplets'
    | 'simpleConcealedTriplets'
    | 'simpleOpenTriplets'
    | 'terminalConcealedKans'
    | 'terminalOpenKans'
    | 'simpleConcealedKans'
    | 'simpleOpenKans'
  >;
  label: string;
  helper: string;
}> = [
  { key: 'terminalConcealedTriplets', label: '1・9・字牌の暗刻数', helper: '1つにつき8符' },
  { key: 'terminalOpenTriplets', label: '1・9・字牌の明刻数', helper: '1つにつき4符' },
  { key: 'simpleConcealedTriplets', label: '2〜8牌の暗刻数', helper: '1つにつき4符' },
  { key: 'simpleOpenTriplets', label: '2〜8牌の明刻数', helper: '1つにつき2符' },
  { key: 'terminalConcealedKans', label: '1・9・字牌の暗槓数', helper: '1つにつき32符' },
  { key: 'terminalOpenKans', label: '1・9・字牌の明槓数', helper: '1つにつき16符' },
  { key: 'simpleConcealedKans', label: '2〜8牌の暗槓数', helper: '1つにつき16符' },
  { key: 'simpleOpenKans', label: '2〜8牌の明槓数', helper: '1つにつき8符' },
];

export const FuAssistant: React.FC<FuAssistantProps> = ({
  state,
  result,
  hasNaki,
  winMethod,
  han,
  onChange,
  onReset,
}) => {
  const isSpecialCaseLocked = state.specialCase === 'chiitoitsu' || state.specialCase === 'pinfu';
  const isApplicable = isFuAssistantApplicable({ han });
  const isUiDisabled = !isApplicable || state.specialCase === 'chiitoitsu';
  const meldCount = getFuAssistantMeldCount(state);
  const remainingMeldSlots = getMaxRemainingMeldSlots(state);

  const getOptionButtonClassName = (isSelected: boolean, disabled = false) => {
    if (disabled) {
      return 'cursor-not-allowed border border-gray-700 bg-gray-800 text-gray-400';
    }
    return isSelected
      ? 'border-2 border-amber-600 bg-amber-500 text-white shadow-lg'
      : 'border border-blue-300/50 bg-blue-950/40 text-blue-50 hover:bg-blue-900/70';
  };

  return (
    <div className="rounded-2xl border border-dashed border-blue-300/60 bg-blue-100/10 p-4 shadow-lg backdrop-blur-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full border border-blue-200/60 bg-white/15 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-blue-50">
            OPTIONAL ASSIST
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">符計算補助</h2>
          <p className="mt-1 text-sm text-blue-100/85">
            符が分からないときだけ使う補助機能です。ここで出した符を上段の点数入力へ反映します。
          </p>
        </div>
        <button
          onClick={onReset}
          className="rounded-lg border border-blue-200/60 bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
        >
          入力をクリア
        </button>
      </div>

      <div className="mb-5 grid gap-3 rounded-xl border border-blue-200/60 bg-white/90 p-4 text-slate-800 sm:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-blue-700">CURRENT STATE</div>
          <div className="mt-2 text-lg font-semibold text-slate-800">
            {winMethod === 'tsumo' ? 'ツモ' : 'ロン'} / {hasNaki ? '鳴きあり' : '門前'}
          </div>
        </div>
        <div className="text-sm text-slate-600">
          ツモの2符、門前ロンの10符はこの状態を見て自動で計算します。
        </div>
      </div>

      {!isApplicable && (
        <div className="mb-5 rounded-xl border border-red-300/50 bg-red-500/15 p-4 text-sm text-red-50">
          4翻以上ではこの簡易符入力UIは使えません。通常形の3翻以下で使ってください。
        </div>
      )}

      {isApplicable && (
        <div className="mb-5 rounded-xl border border-blue-200/60 bg-white/15 p-4 text-sm text-blue-50">
          現在の面子数: {meldCount} / 4
          <span className="ml-2 text-blue-100/75">残り {remainingMeldSlots} 面子まで入力できます。</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COUNTER_FIELDS.map((field) => (
          <CounterField
            key={field.key}
            testId={`counter-${field.key}`}
            label={field.label}
            helper={field.helper}
            value={state[field.key]}
            onChange={(value) => onChange(field.key, value)}
            disabled={isUiDisabled || isSpecialCaseLocked || (!hasNaki && field.key.includes('Open'))}
            incrementDisabled={remainingMeldSlots === 0}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-blue-300/40 bg-blue-950/25 p-4">
          <div className="mb-3 text-sm font-semibold text-blue-100">待ちタイプ</div>
          <div className="grid grid-cols-2 gap-3">
            {WAIT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange('waitType', option.value)}
                disabled={!isApplicable || isSpecialCaseLocked}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all ${getOptionButtonClassName(
                  state.waitType === option.value,
                  !isApplicable || isSpecialCaseLocked,
                )}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-blue-300/40 bg-blue-950/25 p-4">
          <div className="mb-3 text-sm font-semibold text-blue-100">雀頭</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onChange('isYakuhaiPair', false)}
              disabled={!isApplicable || isSpecialCaseLocked}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all ${getOptionButtonClassName(
                !state.isYakuhaiPair,
                !isApplicable || isSpecialCaseLocked,
              )}`}
            >
              役牌ではない
            </button>
            <button
              onClick={() => onChange('isYakuhaiPair', true)}
              disabled={!isApplicable || isSpecialCaseLocked}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all ${getOptionButtonClassName(
                state.isYakuhaiPair,
                !isApplicable || isSpecialCaseLocked,
              )}`}
            >
              役牌
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-blue-300/40 bg-blue-950/25 p-4">
          <div className="mb-3 text-sm font-semibold text-blue-100">例外</div>
          <div className="grid gap-3">
            {SPECIAL_CASE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange('specialCase', option.value)}
                className={`rounded-lg px-4 py-3 text-left text-sm font-semibold transition-all ${getOptionButtonClassName(
                  state.specialCase === option.value,
                )}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-blue-100/75">
            {SPECIAL_CASE_OPTIONS.find((option) => option.value === state.specialCase)?.helper}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-blue-200/60 bg-white/15 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-blue-100/75">RAW FU</div>
            <div className="mt-2 text-2xl font-bold text-white">{result.rawFu}符</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-blue-100/75">FINAL FU</div>
            <div className="mt-2 text-2xl font-bold text-white">{result.roundedFu}符</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-blue-100/75">STATUS</div>
            <div className="mt-2 text-sm font-medium text-blue-50">
              {!result.isApplicable
                ? '4翻以上のため補助入力は停止中です。'
                : result.isValid
                  ? `上段の符へ ${result.roundedFu}符 を反映しています。`
                  : result.error}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
