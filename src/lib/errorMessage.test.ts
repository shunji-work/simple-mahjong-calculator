import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NETWORK_ERROR_MESSAGE, UserFacingError, getErrorMessage, isNetworkError } from './errorMessage';

const FALLBACK = '保存に失敗しました';

describe('getErrorMessage', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('passes through user-facing errors without logging', () => {
    expect(getErrorMessage(new UserFacingError('削除できませんでした'), FALLBACK)).toBe(
      '削除できませんでした',
    );
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('maps network failures and logs the original error', () => {
    const err = new TypeError('Failed to fetch');
    expect(getErrorMessage(err, FALLBACK)).toBe(NETWORK_ERROR_MESSAGE);
    expect(getErrorMessage({ message: 'TypeError: Load failed', code: '' }, FALLBACK)).toBe(
      NETWORK_ERROR_MESSAGE,
    );
    expect(getErrorMessage({ name: 'AuthRetryableFetchError', message: '{}' }, FALLBACK)).toBe(
      NETWORK_ERROR_MESSAGE,
    );
    expect(consoleError).toHaveBeenCalledWith(err);
  });

  it('maps PostgREST / Postgres error codes', () => {
    expect(getErrorMessage({ code: '42501', message: 'new row violates row-level security policy' }, FALLBACK)).toMatch(
      /権限がありません/,
    );
    expect(getErrorMessage({ code: '23514', message: 'violates check constraint' }, FALLBACK)).toMatch(
      /入力内容が正しくありません/,
    );
    expect(getErrorMessage({ code: 'PGRST301', message: 'JWT expired' }, FALLBACK)).toMatch(
      /ログインの有効期限/,
    );
    expect(getErrorMessage({ code: 'PGRST116', message: 'no rows' }, FALLBACK)).toMatch(
      /見つかりませんでした/,
    );
  });

  it('maps auth errors', () => {
    expect(getErrorMessage({ code: 'captcha_failed', status: 400, message: 'captcha protection: request disallowed' }, FALLBACK)).toMatch(
      /Bot 対策/,
    );
    expect(getErrorMessage({ status: 429, message: 'Request rate limit reached' }, FALLBACK)).toMatch(
      /アクセスが集中/,
    );
    expect(getErrorMessage({ status: 503, message: 'Service Unavailable' }, FALLBACK)).toMatch(
      /サーバーで問題/,
    );
  });

  it('never surfaces unknown raw English messages', () => {
    expect(getErrorMessage(new Error('Something weird happened'), FALLBACK)).toBe(FALLBACK);
    expect(getErrorMessage('oops', FALLBACK)).toBe(FALLBACK);
    expect(getErrorMessage(null, FALLBACK)).toBe(FALLBACK);
  });
});

describe('isNetworkError', () => {
  it('detects fetch failures only', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new Error('permission denied'))).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});
