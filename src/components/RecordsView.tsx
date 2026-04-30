import { useCallback, useEffect, useMemo, useState } from 'react';
import { LogIn, Plus, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { deleteGame, listRecentGames } from '../lib/games';
import type { FilterGenre, GameRecord } from '../types/game';
import { AuthDialog } from './AuthDialog';
import { GameHistoryList } from './GameHistoryList';
import { GameRecordDialog } from './GameRecordDialog';
import { RecordsChart } from './RecordsChart';

const HISTORY_LIMIT = 30;

type GenreFilter = 'all' | FilterGenre;

const GENRE_FILTER_OPTIONS: ReadonlyArray<{ id: GenreFilter; label: string }> = [
  { id: 'all', label: 'すべて' },
  { id: 'free_5', label: 'フリー5' },
  { id: 'free_1', label: 'フリー1' },
  { id: 'free_total', label: 'フリー総合' },
  { id: 'friend', label: '友人' },
];

function applyGenreFilter(games: GameRecord[], filter: GenreFilter): GameRecord[] {
  if (filter === 'all') return games;
  if (filter === 'free_total') {
    return games.filter((g) => g.genre === 'free_5' || g.genre === 'free_1');
  }
  return games.filter((g) => g.genre === filter);
}

export function RecordsView() {
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState<GenreFilter>('all');

  const fetchGames = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await listRecentGames(userId, HISTORY_LIMIT);
      setGames(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : '対局履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setGames([]);
      setError(null);
      return;
    }
    void fetchGames(user.id);
  }, [user, fetchGames]);

  const filteredGames = useMemo(
    () => applyGenreFilter(games, genreFilter),
    [games, genreFilter],
  );

  const handleEdit = useCallback((g: GameRecord) => {
    setEditingGame(g);
    setRecordDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (g: GameRecord) => {
    if (!window.confirm('この対局記録を削除しますか？\nこの操作は取り消せません。')) {
      return;
    }
    setDeletingId(g.id);
    setError(null);
    try {
      await deleteGame(g.id);
      setGames((prev) => prev.filter((x) => x.id !== g.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleSaved = useCallback((record: GameRecord) => {
    setGames((prev) => {
      const existsIdx = prev.findIndex((g) => g.id === record.id);
      if (existsIdx >= 0) {
        const next = [...prev];
        next[existsIdx] = record;
        // played_at 降順を維持して並べ替え
        next.sort((a, b) => (a.playedAt < b.playedAt ? 1 : -1));
        return next;
      }
      return [record, ...prev].slice(0, HISTORY_LIMIT);
    });
  }, []);

  const closeRecordDialog = useCallback(() => {
    setRecordDialogOpen(false);
    setEditingGame(null);
  }, []);

  if (authLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-white/60">
        認証状態を確認中…
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center shadow-xl">
          <Trophy className="mx-auto mb-3 h-12 w-12 text-amber-300" />
          <h2 className="text-lg font-bold text-white">ログインして対局を記録しよう</h2>
          <p className="mt-2 text-sm text-white/70">
            点数や順位を保存して、直近の戦績を振り返れます。
          </p>
          <button
            type="button"
            onClick={() => setAuthDialogOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 font-medium text-amber-100 transition hover:bg-amber-500/25"
          >
            <LogIn className="h-4 w-4" />
            ログインする
          </button>
        </div>
        <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
      </>
    );
  }

  const totalCount = games.length;
  const filteredCount = filteredGames.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">直近の対局</h2>
        <button
          type="button"
          onClick={() => {
            setEditingGame(null);
            setRecordDialogOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25"
        >
          <Plus className="h-4 w-4" />
          対局を記録
        </button>
      </div>

      {totalCount > 0 && (
        <div
          role="tablist"
          aria-label="ジャンルフィルタ"
          className="flex flex-wrap gap-1.5"
        >
          {GENRE_FILTER_OPTIONS.map((opt) => {
            const active = genreFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setGenreFilter(opt.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition sm:text-sm ${
                  active
                    ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                    : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {totalCount === 0 && !loading && !error ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center shadow-xl">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-amber-300" />
          <h3 className="text-base font-bold text-white">最初の対局を記録してみよう</h3>
          <ul className="mx-auto mt-3 max-w-sm space-y-1 text-left text-xs text-white/70">
            <li>・ ルール（4麻 / 3麻）と最終素点・順位を入力</li>
            <li>・ ジャンル（フリー5 / フリー1 / 友人）でフィルタできます</li>
            <li>・ 4麻5万点・3麻7万点以上のトップは ★ がつきます</li>
          </ul>
          <button
            type="button"
            onClick={() => {
              setEditingGame(null);
              setRecordDialogOpen(true);
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 font-medium text-amber-100 transition hover:bg-amber-500/25"
          >
            <Plus className="h-4 w-4" />
            対局を記録
          </button>
        </div>
      ) : (
        <>
          {filteredCount > 0 && <RecordsChart games={filteredGames} />}

          {totalCount > 0 && filteredCount === 0 && !loading && (
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-white/60">
              選択中のジャンルに該当する対局はありません。
            </div>
          )}

          <GameHistoryList
            games={filteredGames}
            loading={loading}
            error={error}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </>
      )}

      <GameRecordDialog
        open={recordDialogOpen}
        onClose={closeRecordDialog}
        onSaved={handleSaved}
        onRequestLogin={() => setAuthDialogOpen(true)}
        editing={editingGame}
      />
      <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
    </div>
  );
}
