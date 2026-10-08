import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { getErrorMessage } from '../lib/errorMessage';
import { MEMO_MAX_LENGTH, SCORE_MAX, SCORE_MIN, validateGameForm } from '../lib/gameValidation';
import { insertGame, updateGame } from '../lib/games';
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
  /** 指定すると編集モードで開く */
  editing?: GameRecord | null;
}

function nowAsLocalInput(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 16);
}

function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return nowAsLocalInput();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

export function GameRecordDialog({ open, onClose, onSaved, onRequestLogin, editing }: Props) {
  const { user, isAnonymous } = useAuth();
  const isEditing = editing != null;

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
    if (editing) {
      setRuleset(editing.ruleset);
      setScore(String(editing.score));
      setRank(editing.rank);
      setGenre(editing.genre);
      setPlayedAtLocal(isoToLocalInput(editing.playedAt));
      setMemo(editing.memo ?? '');
    } else {
      setRuleset('4ma');
      setScore('');
      setRank(null);
      setGenre('free_5');
      setPlayedAtLocal(nowAsLocalInput());
      setMemo('');
    }
    setSubmitting(false);
    setError(null);
  }, [open, editing]);

  useEffect(() => {
    if (rank != null && rank > maxRank) {
      setRank(null);
    }
  }, [maxRank, rank]);

  // 保存中は閉じられないようにする（保存結果を取りこぼさないため）
  const requestClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [submitting, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, requestClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('ログインしてから記録してください。');
      return;
    }

    const validation = validateGameForm({ ruleset, score, rank, playedAtLocal, memo });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    const { value } = validation;

    setSubmitting(true);
    try {
      const record = isEditing
        ? await updateGame({
            id: editing.id,
            userId: user.id,
            playedAt: value.playedAt,
            ruleset,
            score: value.score,
            rank: value.rank,
            genre,
            memo: value.memo,
          })
        : await insertGame({
            userId: user.id,
            playedAt: value.playedAt,
            ruleset,
            score: value.score,
            rank: value.rank,
            genre,
            memo: value.memo,
          });
      onSaved(record);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, '保存に失敗しました。時間をおいて、もう一度お試しください。'));
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
      onClick={requestClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={requestClose}
          disabled={submitting}
          aria-label="閉じる"
          className="absolute right-3 top-3 rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="game-record-dialog-title" className="text-lg font-bold text-white">
          {isEditing ? '対局を編集' : '対局を記録'}
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
                  ゲストモードで利用中です。ブラウザや端末を変えると記録は見られなくなり、後から Google でログインしても引き継がれません。
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
                min={SCORE_MIN}
                max={SCORE_MAX}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="例: 32500"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-base text-white placeholder-white/30 outline-none transition focus:border-amber-400/60 focus:bg-white/10"
              />
              <p className="mt-1 text-xs text-white/50">100点単位で入力。マイナスも入力できます（例: -3000）</p>
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
                maxLength={MEMO_MAX_LENGTH}
                placeholder="例: 序盤リードして逃げ切り"
                className="w-full resize-none rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-amber-400/60 focus:bg-white/10"
              />
              <p className="mt-1 text-right text-[11px] text-white/40">
                {memo.length} / {MEMO_MAX_LENGTH}
              </p>
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
              {submitting ? '保存中…' : isEditing ? '変更を保存' : 'この対局を保存'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
