// 麻雀点数ナビ Service Worker
// - 同一オリジンの GET のみを扱い、Supabase / Turnstile / Google などのクロスオリジン通信には一切触れない
// - ページ遷移: ネットワーク優先、オフライン時はキャッシュ済みの '/'（index.html）を返す
// - /assets/*（ビルド時にハッシュ付きファイル名になる）: キャッシュ優先
// キャッシュの中身を作り直したい場合は CACHE_VERSION を上げる（activate 時に古いキャッシュを削除する）

const CACHE_PREFIX = 'mahjong-navi-';
const CACHE_VERSION = 'v1';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const APP_SHELL_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(APP_SHELL_URL))
      // オフライン用シェルの事前キャッシュに失敗してもインストール自体は続行する
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isCacheableResponse(response) {
  return response && response.ok && response.status === 200 && response.type === 'basic';
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      // SPA なのでどの URL への遷移も index.html を返す。'/' のキーで最新のシェルを保持する
      await cache.put(APP_SHELL_URL, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(APP_SHELL_URL);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.headers.has('range')) return;

  const url = new URL(request.url);
  // クロスオリジン（Supabase / Turnstile / Google 等）はブラウザに任せる
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
  }
  // それ以外の同一オリジンのリクエストは介入しない
});
