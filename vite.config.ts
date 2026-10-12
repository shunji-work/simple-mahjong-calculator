import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SERVICE_WORKER_FILE = 'sw.js';
// オフラインの点数計算に不要なファイル（SNS シェア用画像・ソースマップ）は事前キャッシュしない
const PRECACHE_EXCLUDE = [/^sw\.js$/, /^og-image\.png$/, /\.map$/];

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

/**
 * ビルド後の dist/sw.js に、事前キャッシュするファイル一覧とキャッシュのバージョンを書き込む。
 * バージョンはファイル内容のハッシュなので、中身が変わったビルドでだけ Service Worker が更新される。
 */
function precacheServiceWorker(): Plugin {
  let outDir = '';
  return {
    name: 'precache-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = listFiles(outDir)
        .map((path) => relative(outDir, path).split(sep).join('/'))
        .filter((file) => !PRECACHE_EXCLUDE.some((pattern) => pattern.test(file)))
        .sort();

      const hash = createHash('sha256');
      for (const file of files) {
        hash.update(file);
        hash.update(readFileSync(join(outDir, file)));
      }
      const version = hash.digest('hex').slice(0, 12);
      const urls = files.map((file) => (file === 'index.html' ? '/' : `/${file}`));

      const swPath = join(outDir, SERVICE_WORKER_FILE);
      const source = readFileSync(swPath, 'utf8');
      const replaced = source
        .replace("const CACHE_VERSION = 'dev';", `const CACHE_VERSION = '${version}';`)
        .replace('const PRECACHE_URLS = [];', `const PRECACHE_URLS = ${JSON.stringify(urls)};`);
      if (!replaced.includes(version) || !replaced.includes(JSON.stringify(urls))) {
        throw new Error(`${SERVICE_WORKER_FILE} のプレースホルダーが見つかりません`);
      }
      writeFileSync(swPath, replaced);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), precacheServiceWorker()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
