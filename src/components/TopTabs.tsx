import { Calculator, Trophy } from 'lucide-react';

export type TopTab = 'calc' | 'records';

interface TopTabsProps {
  active: TopTab;
  onChange: (tab: TopTab) => void;
}

const TABS: Array<{ id: TopTab; label: string; description: string; Icon: typeof Calculator }> = [
  { id: 'calc', label: '点数計算', description: '役選択 / マニュアル入力', Icon: Calculator },
  { id: 'records', label: '戦績', description: '対局を記録して振り返る', Icon: Trophy },
];

export function TopTabs({ active, onChange }: TopTabsProps) {
  return (
    <div className="mb-6 grid gap-3 rounded-2xl border border-white/15 bg-slate-950/30 p-2 shadow-xl backdrop-blur-sm sm:grid-cols-2">
      {TABS.map(({ id, label, description, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            data-testid={`top-tab-${id}`}
            onClick={() => onChange(id)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
              isActive
                ? 'border-amber-400 bg-amber-500/20 text-white shadow-lg'
                : 'border-white/10 bg-slate-900/50 text-white/80 hover:bg-slate-900/70'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-amber-300' : 'text-white/60'}`} />
            <div>
              <div className="text-base font-bold sm:text-lg">{label}</div>
              <div className={`mt-0.5 text-xs sm:text-sm ${isActive ? 'text-amber-100' : 'text-white/60'}`}>
                {description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
