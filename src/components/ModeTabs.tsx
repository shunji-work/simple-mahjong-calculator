import React from 'react';
import { AppMode } from '../types/mahjong';

interface ModeTabsProps {
  activeMode: AppMode;
  onChange: (mode: AppMode) => void;
}

const MODES: Array<{ id: AppMode; label: string; description: string }> = [
  { id: 'yaku', label: '役選択モード', description: '役を選んで点数を確認' },
  { id: 'manual', label: 'マニュアルモード', description: '翻数と符を直接入力' },
];

export const ModeTabs: React.FC<ModeTabsProps> = ({ activeMode, onChange }) => {
  return (
    <div className="mb-6 grid gap-3 rounded-2xl border border-white/15 bg-slate-950/30 p-2 shadow-xl backdrop-blur-sm sm:grid-cols-2">
      {MODES.map((mode) => {
        const isActive = activeMode === mode.id;
        const isManual = mode.id === 'manual';
        return (
          <button
            key={mode.id}
            data-testid={`mode-tab-${mode.id}`}
            onClick={() => onChange(mode.id)}
            className={`rounded-xl border px-4 py-4 text-left transition-all duration-200 ${
              isActive
                ? isManual
                  ? 'border-blue-200 bg-blue-200/20 text-white shadow-lg'
                  : 'border-amber-500 bg-amber-500/20 text-white shadow-lg'
                : isManual
                  ? 'border-blue-300/30 bg-blue-950/40 text-blue-50 hover:bg-blue-900/60'
                  : 'border-emerald-800 bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800/70'
            }`}
          >
            <div className="text-base font-bold sm:text-lg">{mode.label}</div>
            <div
              className={`mt-1 text-sm ${
                isActive ? (isManual ? 'text-blue-50' : 'text-amber-100') : isManual ? 'text-blue-100/75' : 'text-emerald-300'
              }`}
            >
              {mode.description}
            </div>
          </button>
        );
      })}
    </div>
  );
};
