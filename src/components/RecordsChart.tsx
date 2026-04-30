import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon, Star } from 'lucide-react';
import { isStarGame } from '../lib/games';
import {
  GameRecord,
  GENRE_LABEL,
  RULESET_LABEL,
  Ruleset,
} from '../types/game';

interface Props {
  games: GameRecord[];
}

const RANGE_OPTIONS = [5, 10, 30] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

const RULESET_OPTIONS: ReadonlyArray<{ id: Ruleset; label: string }> = [
  { id: '4ma', label: '4麻' },
  { id: '3ma', label: '3麻' },
];

const STAR_THRESHOLD: Record<Ruleset, number> = {
  '4ma': 50000,
  '3ma': 70000,
};

interface ChartPoint {
  index: number;
  score: number;
  isStar: boolean;
  playedAt: string;
  rank: number;
  genre: GameRecord['genre'];
}

function formatPlayedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
}

function ScoreDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null || !payload) return null;
  if (payload.isStar) {
    return (
      <g>
        {/* halo */}
        <circle cx={cx} cy={cy} r={11} fill="#fbbf24" fillOpacity={0.18} />
        {/* star */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={20}
          fill="#fbbf24"
          stroke="#92400e"
          strokeWidth={0.6}
        >
          ★
        </text>
      </g>
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#fde68a"
      stroke="#1e293b"
      strokeWidth={1.5}
    />
  );
}

interface TooltipPayloadItem {
  payload: ChartPoint;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-white/15 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-xl">
      <div className="text-white/60">{formatPlayedAt(p.playedAt)}</div>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] text-white/80">
          {GENRE_LABEL[p.genre]}
        </span>
        <span className="text-white/80">{p.rank}位</span>
      </div>
      <div className="mt-1 flex items-center gap-1 font-mono text-sm font-bold text-amber-200">
        {p.score.toLocaleString('ja-JP')}
        {p.isStar && <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />}
      </div>
    </div>
  );
}

export function RecordsChart({ games }: Props) {
  const [ruleset, setRuleset] = useState<Ruleset>('4ma');
  const [range, setRange] = useState<RangeOption>(10);

  const points = useMemo<ChartPoint[]>(() => {
    // games は played_at desc で渡ってくる前提。
    // 直近 N 件を取り、グラフは古い→新しいの順に並べる。
    const filtered = games.filter((g) => g.ruleset === ruleset).slice(0, range);
    const ordered = [...filtered].reverse();
    return ordered.map((g, i) => ({
      index: i + 1,
      score: g.score,
      isStar: isStarGame(g),
      playedAt: g.playedAt,
      rank: g.rank,
      genre: g.genre,
    }));
  }, [games, ruleset, range]);

  const starThreshold = STAR_THRESHOLD[ruleset];
  const totalForRuleset = useMemo(
    () => games.filter((g) => g.ruleset === ruleset).length,
    [games, ruleset],
  );

  const yDomain = useMemo<[number, number] | undefined>(() => {
    if (points.length === 0) return undefined;
    const scores = points.map((p) => p.score);
    const min = Math.min(...scores, 25000);
    const max = Math.max(...scores, starThreshold);
    const pad = 5000;
    return [Math.floor((min - pad) / 5000) * 5000, Math.ceil((max + pad) / 5000) * 5000];
  }, [points, starThreshold]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 shadow-xl sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
          <LineChartIcon className="h-5 w-5 text-amber-300" />
          スコア推移
        </h3>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="ルール切替"
            className="inline-flex overflow-hidden rounded-lg border border-white/15"
          >
            {RULESET_OPTIONS.map((opt) => {
              const active = ruleset === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRuleset(opt.id)}
                  className={`px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                    active
                      ? 'bg-amber-500/25 text-amber-100'
                      : 'bg-slate-900/60 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div
            role="tablist"
            aria-label="期間切替"
            className="inline-flex overflow-hidden rounded-lg border border-white/15"
          >
            {RANGE_OPTIONS.map((n) => {
              const active = range === n;
              return (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRange(n)}
                  className={`px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                    active
                      ? 'bg-amber-500/25 text-amber-100'
                      : 'bg-slate-900/60 text-white/70 hover:bg-white/10'
                  }`}
                >
                  直近{n}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-slate-950/40 p-6 text-center text-sm text-white/60">
          {totalForRuleset === 0
            ? `${RULESET_LABEL[ruleset]}の記録がまだありません。`
            : `${RULESET_LABEL[ruleset]}の記録は${totalForRuleset}件です。`}
        </div>
      ) : (
        <>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="index"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                  domain={yDomain ?? ['auto', 'auto']}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: 'rgba(251,191,36,0.4)', strokeWidth: 1 }}
                />
                <ReferenceLine
                  y={30000}
                  stroke="rgba(255,255,255,0.25)"
                  strokeDasharray="4 4"
                  label={{
                    value: '原点 30k',
                    fill: 'rgba(255,255,255,0.55)',
                    fontSize: 10,
                    position: 'right',
                  }}
                />
                <ReferenceLine
                  y={starThreshold}
                  stroke="rgba(251,191,36,0.45)"
                  strokeDasharray="4 4"
                  label={{
                    value: `★ ${(starThreshold / 1000).toFixed(0)}k`,
                    fill: '#fcd34d',
                    fontSize: 10,
                    position: 'right',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={<ScoreDot />}
                  activeDot={{ r: 5, fill: '#fde68a', stroke: '#1e293b', strokeWidth: 1.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-white/50">
            ★ = {RULESET_LABEL[ruleset]}で{(starThreshold / 1000).toFixed(0)}点以上のトップ。
            グラフ左が古く、右が新しい対局です（直近{points.length}件 / 全{totalForRuleset}件）。
          </p>
        </>
      )}
    </section>
  );
}
