import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AuthDialog({ open, onClose }: Props) {
  const { signInWithGoogle, signInAnonymously } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Googleログインに失敗しました');
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInAnonymously();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ゲストサインインに失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
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

        <h2 id="auth-dialog-title" className="text-lg font-bold text-white">
          ログインして対局を記録
        </h2>
        <p className="mt-2 text-sm text-white/70">
          ログインすると、点数や順位を保存して後から振り返ることができます。
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg border border-white/20 bg-white px-4 py-3 font-medium text-slate-900 shadow transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleLogo />
          Googleでログイン
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-white/50">
          <div className="h-px flex-1 bg-white/15" />
          <span>または</span>
          <div className="h-px flex-1 bg-white/15" />
        </div>

        <button
          type="button"
          onClick={handleGuest}
          disabled={submitting}
          className="w-full rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          ゲストとして使う
        </button>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 p-2 text-xs text-red-200"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.06-1.4-.18-2H12v3.8h5.4c-.23 1.25-.94 2.3-2 3v2.5h3.24c1.9-1.75 2.96-4.32 2.96-7.3z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.6-2.4l-3.24-2.5c-.9.6-2.05.95-3.36.95-2.58 0-4.77-1.74-5.55-4.08H3.1v2.56C4.74 19.78 8.1 22 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.45 13.97A6 6 0 0 1 6.13 12c0-.68.12-1.34.32-1.97V7.47H3.1A10 10 0 0 0 2 12c0 1.62.39 3.15 1.1 4.53l3.35-2.56z"
      />
      <path
        fill="#EA4335"
        d="M12 5.92c1.46 0 2.78.5 3.81 1.49l2.86-2.86C16.95 2.99 14.7 2 12 2 8.1 2 4.74 4.22 3.1 7.47l3.35 2.56C7.23 7.66 9.42 5.92 12 5.92z"
      />
    </svg>
  );
}
