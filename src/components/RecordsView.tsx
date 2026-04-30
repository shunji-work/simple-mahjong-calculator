import { useCallback, useEffect, useState } from 'react';
import { LogIn, Plus, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { listRecentGames } from '../lib/games';
import type { GameRecord } from '../types/game';
import { AuthDialog } from './AuthDialog';
import { GameHistoryList } from './GameHistoryList';
import { GameRecordDialog } from './GameRecordDialog';
import { RecordsChart } from './RecordsChart';

const HISTORY_LIMIT = 30;

export function RecordsView() {
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">直近の対局</h2>
        <button
          type="button"
          onClick={() => setRecordDialogOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25"
        >
          <Plus className="h-4 w-4" />
          対局を記録
        </button>
      </div>

      {games.length > 0 && <RecordsChart games={games} />}

      <GameHistoryList games={games} loading={loading} error={error} />

      <GameRecordDialog
        open={recordDialogOpen}
        onClose={() => setRecordDialogOpen(false)}
        onSaved={() => {
          void fetchGames(user.id);
        }}
        onRequestLogin={() => setAuthDialogOpen(true)}
      />
      <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
    </div>
  );
}
