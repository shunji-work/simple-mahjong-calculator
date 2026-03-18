import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface CounterFieldProps {
  label: string;
  helper?: string;
  value: number;
  onChange: (value: number) => void;
  testId?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  incrementDisabled?: boolean;
  decrementDisabled?: boolean;
}

export const CounterField: React.FC<CounterFieldProps> = ({
  label,
  helper,
  value,
  onChange,
  testId,
  min = 0,
  max = 4,
  disabled = false,
  incrementDisabled = false,
  decrementDisabled = false,
}) => {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));
  const isDecrementDisabled = disabled || decrementDisabled || value <= min;
  const isIncrementDisabled = disabled || incrementDisabled || value >= max;

  return (
    <div
      data-testid={testId}
      className={`rounded-xl border p-4 ${
        disabled
          ? 'border-gray-700 bg-gray-900/40 opacity-70'
          : 'border-blue-300/50 bg-blue-950/25'
      }`}
    >
      <div className="mb-3">
        <div className="text-sm font-semibold text-white">{label}</div>
        {helper ? <div className="mt-1 text-xs text-blue-100/75">{helper}</div> : null}
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={decrement}
          disabled={isDecrementDisabled}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
            isDecrementDisabled
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <Minus className="h-5 w-5" />
        </button>
        <div className="min-w-[64px] rounded-lg border border-blue-200/60 bg-white/90 px-4 py-2 text-center text-2xl font-bold text-blue-900">
          {value}
        </div>
        <button
          onClick={increment}
          disabled={isIncrementDisabled}
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
            isIncrementDisabled
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
