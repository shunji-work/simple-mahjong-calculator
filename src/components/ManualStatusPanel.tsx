import React from 'react';
import { ManualState } from '../types/mahjong';

interface ManualStatusPanelProps {
  manualState: ManualState;
}

export const ManualStatusPanel: React.FC<ManualStatusPanelProps> = ({ manualState }) => (
  <div className="mt-6 rounded-xl border border-blue-200/40 bg-blue-950/25 p-6 shadow-xl backdrop-blur-sm">
    <h3 className="mb-3 text-sm font-bold text-amber-400">マニュアル入力の状態</h3>
    <div className="space-y-2 text-sm text-blue-50">
      <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
        <span>あがり方</span>
        <span>{manualState.winMethod === 'tsumo' ? 'ツモ' : 'ロン'}</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
        <span>状態</span>
        <span>
          {manualState.isOya ? '親' : '子'} /{' '}
          {manualState.hasNaki ? '鳴きあり' : '門前'}
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
        <span>翻数</span>
        <span>{manualState.han ? `${manualState.han}翻` : '未選択'}</span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
        <span>符</span>
        <span>
          {manualState.fu ? `${manualState.fu}符` : '未選択'}{' '}
          {manualState.fuSource === 'assistant' ? '（補助反映）' : '（手動）'}
        </span>
      </div>
    </div>
  </div>
);
