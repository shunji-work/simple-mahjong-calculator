import { useCallback, useEffect, useState } from 'react';
import { CloudOff, LogIn, Plus, Sparkles, Trophy, X } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { getErrorMessage } from '../lib/errorMessage';
import { deleteGame, listRecentGames, matchesGameFilter } from '../lib/games';
import {
  RULESET_LABEL,
  RULESETS,
  type FilterGenre,
  type GameRecord,
  type Ruleset,
} from '../types/game';
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

function toGenreOption(filter: GenreFilter): FilterGenre | undefined {
  return filter === 'all' ? undefined : filter;
}

function byPlayedAtDesc(a: GameRecord, b: GameRecord): number {
  return new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime();
}

function chipClass(active: boolean): string {
  return `rounded-full border px-3 py-1 text-xs font-medium transition sm:text-sm ${
    active
      ? 'border-amber-400 bg-amber-500/20 text-amber-100'
      : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
  }`;
}

export function RecordsView() {
  const { user, loading: authLoading, available } = useAuth();
  const userId = user?.id ?? null;
  const [games, setGames] = useState<GameRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rulesetFilter, setRulesetFilter] = useState<Ruleset>('4ma');
  const [genreFilter, setGenreFilter] = useState<GenreFilter>('all');

  // user オブジェクトはトークン更新のたびに変わるため、user.id にだけ依存する。
  // ユーザー・フィルタが変わったら前の結果を破棄し、古いリクエストの結果は捨てる。
  useEffect(() => {
    setGames([]);
    setTotalCount(0);
    setFetchError(null);
    setActionError(null);

    if (!userId || !available) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    listRecentGames(userId, {
      ruleset: rulesetFilter,
      genre: toGenreOption(genreFilter),
      limit: HISTORY_LIMIT,
    })
      .then((result) => {
        if (cancelled) return;
        setGames(result.games);
        setTotalCount(result.total);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setFetchError(getErrorMessage(e, '対局履歴の取得に失敗しました。'));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, available, rulesetFilter, genreFilter, reloadKey]);

  const handleEdit = useCallback((g: GameRecord) => {
    setEditingGame(g);
    setRecordDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (g: GameRecord) => {
      if (!userId) return;
      if (!window.confirm('この対局記録を削除しますか？\nこの操作は取り消せません。')) {
        return;
      }
      setDeletingId(g.id);
      setActionError(null);
      try {
        await deleteGame(g.id, userId);
        const remaining = games.filter((x) => x.id !== g.id);
        if (remaining.length === 0 && totalCount > 1) {
          // 表示中の行をすべて消したがサーバーにはまだ記録がある場合は取り直す
          setReloadKey((k) => k + 1);
          return;
        }
        setGames(remaining);
        setTotalCount((c) => Math.max(0, c - 1));
      } catch (e) {
        setActionError(getErrorMessage(e, '削除に失敗しました。時間をおいて、もう一度お試しください。'));
      } finally {
        setDeletingId(null);
      }
    },
    [games, totalCount, userId],
  );

  const handleSaved = useCallback(
    (record: GameRecord) => {
      setActionError(null);
      const genre = toGenreOption(genreFilter);
      if (!matchesGameFilter(record, { ruleset: rulesetFilter, genre })) {
        // 保存した記録が表示されるようにフィルタを切り替える（切り替え後に再取得される）
        setRulesetFilter(record.ruleset);
        if (!matchesGameFilter(record, { genre })) {
          setGenreFilter('all');
        }
        return;
      }

      const existed = games.some((g) => g.id === record.id);
      setGames((prev) => {
        const next = prev.some((g) => g.id === record.id)
          ? prev.map((g) => (g.id === record.id ? record : g))
          : [record, ...prev];
        // 新規・編集どちらも played_at 降順を維持してから件数を切り詰める
        next.sort(byPlayedAtDesc);
        return next.slice(0, HISTORY_LIMIT);
      });
      if (!existed) {
        setTotalCount((c) => c + 1);
      }
    },
    [games, genreFilter, rulesetFilter],
  );

  const closeRecordDialog = useCallback(() => {
    setRecordDialogOpen(false);
    setEditingGame(null);
  }, []);

  const openNewRecordDialog = useCallback(() => {
    setEditingGame(null);
    setRecordDialogOpen(true);
  }, []);

  const retryFetch = useCallback(() => setReloadKey((k) => k + 1), []);

  if (!available) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center shadow-xl">
        <CloudOff className="mx-auto mb-3 h-10 w-10 text-white/50" />
        <h2 className="text-base font-bold text-white">記録機能は現在利用できません</h2>
        <p className="mt-2 text-sm text-white/70">
          点数計算はそのままご利用いただけます。時間をおいて再度お試しください。
        </p>
      </div>
    );
  }

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

  const shownCount = games.length;
  const hasGames = totalCount > 0 && shownCount > 0;
  const showEmpty = !loading && !fetchError && !hasGames;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">直近の対局</h2>
        <button
          type="button"
          onClick={openNewRecordDialog}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25"
        >
          <Plus className="h-4 w-4" />
          対局を記録
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div role="tablist" aria-label="ルールフィルタ" className="flex gap-1.5">
          {RULESETS.map((id) => {
            const active = rulesetFilter === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRulesetFilter(id)}
                className={chipClass(active)}
              >
                {RULESET_LABEL[id]}
              </button>
            );
          })}
        </div>
        <div aria-hidden="true" className="h-5 w-px bg-white/15" />
        <div role="tablist" aria-label="ジャンルフィルタ" className="flex flex-wrap gap-1.5">
          {GENRE_FILTER_OPTIONS.map((opt) => {
            const active = genreFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setGenreFilter(opt.id)}
                className={chipClass(active)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"
        >
          <span className="flex-1">{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="エラーを閉じる"
            className="rounded-md p-0.5 text-red-200/80 transition hover:bg-red-500/20 hover:text-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showEmpty ? (
        genreFilter === 'all' ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center shadow-xl">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-amber-300" />
            <h3 className="text-base font-bold text-white">
              {RULESET_LABEL[rulesetFilter]}の対局を記録してみよう
            </h3>
            <ul className="mx-auto mt-3 max-w-sm space-y-1 text-left text-xs text-white/70">
              <li>・ ルール（4麻 / 3麻）と最終素点・順位を入力</li>
              <li>・ ジャンル（フリー5 / フリー1 / 友人）でフィルタできます</li>
              <li>・ 4麻5万点・3麻7万点以上のトップは ★ がつきます</li>
            </ul>
            <button
              type="button"
              onClick={openNewRecordDialog}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 font-medium text-amber-100 transition hover:bg-amber-500/25"
            >
              <Plus className="h-4 w-4" />
              対局を記録
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center text-sm text-white/60">
            選択中の条件（{RULESET_LABEL[rulesetFilter]}・
            {GENRE_FILTER_OPTIONS.find((o) => o.id === genreFilter)?.label}）に該当する対局はありません。
          </div>
        )
      ) : (
        <>
          {hasGames && !loading && !fetchError && (
            <>
              <RecordsChart games={games} ruleset={rulesetFilter} totalCount={totalCount} />
              <p className="text-xs text-white/50">
                全{totalCount}件中、直近{shownCount}件を表示しています。
              </p>
            </>
          )}

          <GameHistoryList
            games={games}
            loading={loading}
            error={fetchError}
            onRetry={retryFetch}
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
