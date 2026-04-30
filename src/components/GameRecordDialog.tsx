import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { insertGame } from '../lib/games';
import {
  GameRecord,
  RULESET_OPTIONS,
  Ruleset,
  STORED_GENRE_OPTIONS,
  StoredGenre,
  maxRankForRuleset,
} from '../types/game';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (record: GameRecord) => void;
  onRequestLogin: () => void;
}

function nowAsLocalInput(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 16);
}

function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

export function GameRecordDialog({ open, onClose, onSaved, onRequestLogin }: Props) {
  const { user, isAnonymous } = useAuth();

  const [ruleset, setRuleset] = useState<Ruleset>('4ma');
  const [score, setScore] = useState<string>('');
  const [rank, setRank] = useState<number | null>(null);
  const [genre, setGenre] = useState<StoredGenre>('free_5');
  const [playedAtLocal, setPlayedAtLocal] = useState<string>(nowAsLocalInput);
  const [memo, setMemo] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxRank = maxRankForRuleset(ruleset);
  const rankOptions = useMemo(
    () => Array.from({ length: maxRank }, (_, i) => i + 1),
    [maxRank],
  );

  useEffect(() => {
    if (!open) return;
    setRuleset('4ma');
    setScore('');
    setRank(null);
    setGenre('free_5');
    setPlayedAtLocal(nowAsLocalInput());
    setMemo('');
    setSubmitting(false);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (rank != null && rank > maxRank) {
      setRank(null);
    }
  }, [maxRank, rank]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('ログインしてから記録してください。');
      return;
    }

    const trimmedScore = score.trim();
    if (trimmedScore === '') {
      setError('点数を入力してください。');
      return;
    }
    const scoreNum = Number(trimmedScore);
    if (!Number.isFinite(scoreNum) || !Number.isInteger(scoreNum)) {
      setError('点数は整数で入力してください。');
      return;
    }

    if (rank == null) {
      setError('順位を選択してください。');
      return;
    }

    if (!playedAtLocal) {
      setError('対局日時を入力してください。');
      return;
    }

    setSubmitting(true);
    try {
      const record = await insertGame({
        userId: user.id,
        playedAt: localInputToIso(playedAtLocal),
        ruleset,
        score: scoreNum,
        rank,
        genre,
        memo: memo.trim() || null,
      });
      onSaved(record);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-record-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute right-3 top-3 rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="game-record-dialog-title" className="text-lg font-bold text-white">
          対局を記録
        </h2>

        {!user ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-white/70">
              対局を保存するにはログインが必要です。
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestLogin();
              }}
              className="w-full rounded-lg border border-amber-400/40 bg-amber-500/15 px-4 py-3 font-medium text-amber-100 transition hover:bg-amber-500/25"
            >
              ログイン画面を開く
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {isAnonymous && (
              <div className="flex items-start gap-2 rounded-md border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  ゲストモードで利用中です。ブラウザや端末を変えると記録は消えます。Google ログインを推奨します。
                </span>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-bold text-white/80">ルール</p>
              <div className="grid grid-cols-2 gap-2">
                {RULESET_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRuleset(opt.id)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      ruleset === opt.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                        : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="game-score" className="mb-2 block text-xs font-bold text-white/80">
                最終素点
              </label>
              <input
                id="game-score"
                type="number"
                inputMode="numeric"
                step={100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="例: 32500"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-base text-white placeholder-white/30 outline-none transition focus:border-amber-400/60 focus:bg-white/10"
              />
              <p className="mt-1 text-xs text-white/50">マイナスも入力できます（例: -3000）</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-white/80">順位</p>
              <div className={`grid gap-2 ${maxRank === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {rankOptions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRank(r)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                      rank === r
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                        : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {r}位
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-white/80">ジャンル</p>
              <div className="grid grid-cols-3 gap-2">
                {STORED_GENRE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGenre(opt.id)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      genre === opt.id
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                        : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="game-played-at" className="mb-2 block text-xs font-bold text-white/80">
                対局日時
              </label>
              <input
                id="game-played-at"
                type="datetime-local"
                value={playedAtLocal}
                onChange={(e) => setPlayedAtLocal(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition focus:border-amber-400/60 focus:bg-white/10"
              />
            </div>

            <div>
              <label htmlFor="game-memo" className="mb-2 block text-xs font-bold text-white/80">
                メモ（任意）
              </label>
              <textarea
                id="game-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
                placeholder="例: 序盤リードして逃げ切り"
                className="w-full resize-none rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-amber-400/60 focus:bg-white/10"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-red-400/30 bg-red-500/10 p-2 text-xs text-red-200"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg border border-amber-400/40 bg-amber-500/20 px-4 py-3 font-bold text-amber-100 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? '保存中…' : 'この対局を保存'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
