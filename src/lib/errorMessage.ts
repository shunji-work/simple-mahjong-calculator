/**
 * そのまま画面に表示してよい（日本語の）メッセージを持つエラー。
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

export const NETWORK_ERROR_MESSAGE =
  '通信に失敗しました。ネットワーク接続を確認して、もう一度お試しください。';

interface ErrorLike {
  message?: unknown;
  code?: unknown;
  status?: unknown;
  name?: unknown;
}

function asErrorLike(error: unknown): ErrorLike | null {
  if (typeof error === 'object' && error !== null) return error as ErrorLike;
  return null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** fetch 失敗などのネットワークエラーか */
export function isNetworkError(error: unknown): boolean {
  const e = asErrorLike(error);
  if (!e) return false;
  if (str(e.name) === 'AuthRetryableFetchError') return true;
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed/i.test(
    str(e.message),
  );
}

/**
 * Supabase / PostgREST / Auth / ネットワークのエラーを日本語のユーザー向けメッセージに変換する。
 * 元のエラーは console.error に出力する。
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof UserFacingError) {
    return error.message;
  }

  console.error(error);

  const e = asErrorLike(error);
  if (!e) return fallback;

  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;

  const code = str(e.code);
  const message = str(e.message);
  const status = typeof e.status === 'number' ? e.status : null;

  // PostgREST / Postgres のエラーコード
  switch (code) {
    case '42501':
      return '権限がありません。ログインし直してから、もう一度お試しください。';
    case 'PGRST301':
    case 'PGRST303':
      return 'ログインの有効期限が切れました。再度ログインしてください。';
    case 'PGRST116':
      return '対象の記録が見つかりませんでした。すでに削除されている可能性があります。';
    case '23514':
    case '22001':
    case '22003':
    case '22P02':
    case '23502':
      return '入力内容が正しくありません。値を確認してください。';
    case 'captcha_failed':
      return 'Bot 対策の確認に失敗しました。もう一度お試しください。';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'アクセスが集中しています。しばらく待ってから、もう一度お試しください。';
    case 'anonymous_provider_disabled':
    case 'provider_disabled':
      return 'このログイン方法は現在利用できません。';
    default:
      break;
  }

  if (status === 429 || /rate limit/i.test(message)) {
    return 'アクセスが集中しています。しばらく待ってから、もう一度お試しください。';
  }
  if (/captcha/i.test(message)) {
    return 'Bot 対策の確認に失敗しました。もう一度お試しください。';
  }
  if (status === 401 || /jwt expired/i.test(message)) {
    return 'ログインの有効期限が切れました。再度ログインしてください。';
  }
  if (status != null && status >= 500) {
    return 'サーバーで問題が発生しました。しばらく待ってから、もう一度お試しください。';
  }

  return fallback;
}
