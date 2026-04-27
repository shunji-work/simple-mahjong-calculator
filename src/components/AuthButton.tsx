import { useEffect, useRef, useState } from 'react';
import { LogIn, LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { AuthDialog } from './AuthDialog';

export function AuthButton() {
  const { user, loading, isAnonymous, signOut } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  if (loading) {
    return (
      <div
        aria-label="認証状態を確認中"
        className="h-9 w-24 animate-pulse rounded-lg border border-white/10 bg-white/5"
      />
    );
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          data-testid="auth-login-button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-100 backdrop-blur-sm transition hover:bg-amber-500/25 sm:gap-2 sm:text-base"
        >
          <LogIn className="h-4 w-4" />
          ログイン
        </button>
        <AuthDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      </>
    );
  }

  const meta = (user.user_metadata ?? {}) as {
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  const displayName = isAnonymous
    ? 'ゲスト'
    : meta.name ?? meta.full_name ?? user.email ?? 'ユーザー';
  const avatarUrl = !isAnonymous ? meta.avatar_url : undefined;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        data-testid="auth-user-menu-button"
        className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10 sm:px-3 sm:py-2"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full" />
        ) : (
          <UserCircle2 className="h-5 w-5 text-amber-300" />
        )}
        <span className="max-w-[8rem] truncate">{displayName}</span>
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-xl"
        >
          {isAnonymous && (
            <div className="border-b border-white/10 px-3 py-2 text-xs text-white/60">
              ゲストモードで利用中
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setMenuOpen(false);
              try {
                await signOut();
              } catch (error) {
                console.error('signOut failed', error);
              }
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
