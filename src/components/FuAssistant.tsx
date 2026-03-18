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
  { value: 'none', label: 'なし', helper: '通常の符加算を使います' },
  { value: 'pinfu', label: '平和', helper: 'ツモ20符 / ロン30符を優先' },
  { value: 'chiitoitsu', label: '七対子', helper: '25符固定' },
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

  return (
    <div className="rounded-xl border border-emerald-700 bg-emerald-800/50 p-4 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">符計算補助</h2>
          <p className="mt-1 text-sm text-emerald-200">
            下の内容から符を自動計算し、上段の符へ反映します。
          </p>
        </div>
        <button
          onClick={onReset}
          className="rounded-lg border border-emerald-600 bg-emerald-900/70 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
        >
          入力をクリア
        </button>
      </div>

      <div className="mb-5 grid gap-3 rounded-xl border border-emerald-700 bg-emerald-950/40 p-4 sm:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">共有状態</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {winMethod === 'tsumo' ? 'ツモ' : 'ロン'} / {hasNaki ? '鳴きあり' : '門前'}
          </div>
        </div>
        <div className="text-sm text-emerald-200">
          ツモの 2 符、門前ロンの 10 符はこの状態を使って自動計算します。
        </div>
      </div>

      {!isApplicable && (
        <div className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          4翻以上ではこの簡易符入力UIは使えません。通常手の3翻以下専用です。
        </div>
      )}

      {isApplicable && (
        <div className="mb-5 rounded-xl border border-emerald-700 bg-emerald-950/40 p-4 text-sm text-emerald-200">
          現在の面子数: {meldCount} / 4
          <span className="ml-2 text-emerald-300">残り {remainingMeldSlots} 面子まで入力できます。</span>
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
        <label className="rounded-xl border border-emerald-700 bg-emerald-900/50 p-4">
          <div className="mb-3 text-sm font-semibold text-emerald-200">待ちタイプ</div>
          <select
            value={state.waitType}
            onChange={(event) => onChange('waitType', event.target.value as WaitType)}
            disabled={!isApplicable || isSpecialCaseLocked}
            className="w-full rounded-lg border border-emerald-600 bg-emerald-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
          >
            {WAIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-emerald-700 bg-emerald-900/50 p-4">
          <div className="mb-3 text-sm font-semibold text-emerald-200">雀頭</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onChange('isYakuhaiPair', false)}
              disabled={!isApplicable || isSpecialCaseLocked}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                !isApplicable || isSpecialCaseLocked
                  ? 'cursor-not-allowed border border-gray-700 bg-gray-800 text-gray-400'
                  : !state.isYakuhaiPair
                  ? 'border-2 border-amber-600 bg-amber-500 text-white'
                  : 'border border-emerald-700 bg-emerald-950 text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              役牌ではない
            </button>
            <button
              onClick={() => onChange('isYakuhaiPair', true)}
              disabled={!isApplicable || isSpecialCaseLocked}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                !isApplicable || isSpecialCaseLocked
                  ? 'cursor-not-allowed border border-gray-700 bg-gray-800 text-gray-400'
                  : state.isYakuhaiPair
                  ? 'border-2 border-amber-600 bg-amber-500 text-white'
                  : 'border border-emerald-700 bg-emerald-950 text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              役牌
            </button>
          </div>
        </div>

        <label className="rounded-xl border border-emerald-700 bg-emerald-900/50 p-4">
          <div className="mb-3 text-sm font-semibold text-emerald-200">例外</div>
          <select
            value={state.specialCase}
            onChange={(event) => onChange('specialCase', event.target.value as FuSpecialCase)}
            className="w-full rounded-lg border border-emerald-600 bg-emerald-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
          >
            {SPECIAL_CASE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="mt-2 text-xs text-emerald-300">
            {SPECIAL_CASE_OPTIONS.find((option) => option.value === state.specialCase)?.helper}
          </div>
        </label>
      </div>

      <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-amber-300">計算途中</div>
            <div className="mt-2 text-2xl font-bold text-white">{result.rawFu}符</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-amber-300">最終符</div>
            <div className="mt-2 text-2xl font-bold text-white">{result.roundedFu}符</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-amber-300">反映状態</div>
            <div className="mt-2 text-sm font-medium text-amber-100">
              {!result.isApplicable
                ? '4翻以上のため簡易符入力は停止中'
                : result.isValid
                ? `上段の符に ${result.roundedFu} 符を反映済み`
                : result.error}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
