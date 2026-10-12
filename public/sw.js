// 麻雀点数ナビ Service Worker
// - 同一オリジンの GET のみを扱い、Supabase / Turnstile / Google などのクロスオリジン通信には一切触れない
// - インストール時に、ビルド成果物（index.html と /assets/* など）をすべて事前キャッシュする
//   → 一度インストールされれば、初回訪問直後でも戦績タブの部品を含めてオフラインで起動できる
// - ページ遷移・アセットともにキャッシュ優先。電波が弱くても待たずに起動する
// - 更新: ビルドごとに sw.js の中身が変わるため、ブラウザが新しい Service Worker を見つけて裏でインストールする。
//   開いている画面が古いファイルを読み込めなくならないよう skipWaiting はせず、
//   アプリ（全タブ）を閉じて開き直したときに新しいバージョンへ切り替わる

const CACHE_PREFIX = 'mahjong-navi-';
// 以下 2 行はビルド時に vite.config.ts の precacheServiceWorker が置き換える（開発時はこのまま）
const CACHE_VERSION = 'dev';
const PRECACHE_URLS = [];
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const APP_SHELL_URL = '/';
const PRECACHE_PATHS = new Set(PRECACHE_URLS);
// /og-image.png などのファイルを直接開いたページ遷移には index.html を返さない
const FILE_PATH_PATTERN = /\/[^/]+\.[^/]+$/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // HTTP キャッシュに残った古い index.html と新しいアセットが混ざらないよう、必ずサーバーから取り直す。
      // 1 つでも失敗したらインストール自体を失敗させ、次回の訪問で再試行させる（中途半端なキャッシュで動かさない）
      .then((cache) =>
        cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }))),
      ),
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

async function appShell(request) {
  const cache = await caches.open(CACHE_NAME);
  // SPA なのでどの URL への遷移も index.html を返す（OAuth の戻り先 /?code=... なども同じ）
  const cached = await cache.match(APP_SHELL_URL);
  if (cached) return cached;
  return fetch(request);
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  // index.html の /favicon.png?v=2 のようなクエリ付き URL も事前キャッシュに当てる
  const cached = await cache.match(request, { ignoreSearch: true });
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
    if (FILE_PATH_PATTERN.test(url.pathname)) return;
    event.respondWith(appShell(request));
    return;
  }

  if (PRECACHE_PATHS.has(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
  }
  // それ以外の同一オリジンのリクエストは介入しない
});
