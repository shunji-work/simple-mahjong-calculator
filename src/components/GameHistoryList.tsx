import { Pencil, Trash2 } from 'lucide-react';
import { GameRecord, GENRE_LABEL, RULESET_LABEL } from '../types/game';

interface Props {
  games: GameRecord[];
  loading: boolean;
  error: string | null;
  onEdit?: (game: GameRecord) => void;
  onDelete?: (game: GameRecord) => void;
  deletingId?: string | null;
}

function formatPlayedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

function formatScore(n: number): string {
  return n.toLocaleString('ja-JP');
}

function rankClass(rank: number): string {
  if (rank === 1) return 'border-amber-400/60 bg-amber-500/15 text-amber-100';
  if (rank === 2) return 'border-slate-300/40 bg-slate-300/10 text-slate-100';
  if (rank === 3) return 'border-orange-300/40 bg-orange-300/10 text-orange-100';
  return 'border-red-300/40 bg-red-300/10 text-red-100';
}

export function GameHistoryList({ games, loading, error, onEdit, onDelete, deletingId }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-white/60">
        読み込み中…
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
      >
        {error}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-8 text-center">
        <p className="text-sm text-white/70">まだ記録がありません。</p>
        <p className="mt-1 text-xs text-white/50">
          上の「+ 対局を記録」から最初の対局を追加してください。
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {games.map((g) => (
        <li
          key={g.id}
          className="rounded-xl border border-white/10 bg-slate-900/50 p-3 sm:p-4"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <span className="text-white/60">{formatPlayedAt(g.playedAt)}</span>
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/80">
              {RULESET_LABEL[g.ruleset]}
            </span>
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/80">
              {GENRE_LABEL[g.genre]}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-bold ${rankClass(g.rank)}`}
            >
              {g.rank}位
            </span>
            <span className="ml-auto font-mono text-base font-bold text-amber-200">
              {formatScore(g.score)}
            </span>
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(g)}
                    aria-label="編集"
                    className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(g)}
                    aria-label="削除"
                    disabled={deletingId === g.id}
                    className="rounded-md p-1.5 text-white/60 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          {g.memo && (
            <p className="mt-2 break-words text-xs text-white/60">{g.memo}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
