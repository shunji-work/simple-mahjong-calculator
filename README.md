# 麻雀点数ナビ

初心者向けの麻雀点数計算・対局記録アプリです。

役を選ぶだけで点数を確認できる「役から計算」モードに加えて、翻数・符を直接入力する「翻符入力」モード、符が分からないときの「符計算補助」、ログイン後に対局結果を保存・可視化できる「戦績」機能を備えています。

## 主な機能

- **役から点数計算**: 役、ドラ、ツモ/ロン、親/子、鳴き有無を選ぶと点数を自動計算
- **翻符入力モード**: 翻数・符を直接指定して点数を計算
- **符計算補助**: 待ち、雀頭、刻子・槓子、門前ロン、ツモ符などから符を補助計算
- **役の自動制御**: 鳴きあり時のメンゼン限定役無効化、ロン時のツモ役除外、同時成立しにくい役の整理
- **満貫以上の判定**: 満貫、跳満、倍満、三倍満、役満を固定点として表示
- **対局記録**: 4麻/3麻、素点、順位、ジャンル、メモ、対局日時を保存
- **戦績グラフ**: 直近 5 / 10 / 30 戦のスコア推移を表示
- **ジャンルフィルタ**: フリー5、フリー1、フリー総合、友人で履歴を絞り込み
- **高得点トップ表示**: 4麻 50,000点以上、3麻 70,000点以上のトップに ★ を表示
- **認証**: Supabase の Google OAuth と匿名ゲストログインに対応
- **Bot対策**: Cloudflare Turnstile を任意で利用可能
- **PWA基盤**: Web App Manifest と Service Worker 登録に対応

## 技術スタック

### フロントエンド

- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- Tailwind CSS 3.4.1
- Lucide React
- Recharts

### バックエンド / 外部サービス

- Supabase
  - Authentication
  - Database
  - Row Level Security
- Cloudflare Turnstile

### テスト / 開発ツール

- Vitest
- Playwright
- ESLint
- PostCSS / Autoprefixer

## プロジェクト構成

```text
src/
├── components/              # UIコンポーネント
│   ├── AuthDialog.tsx        # ログインダイアログ
│   ├── FuAssistant.tsx       # 符計算補助
│   ├── GameRecordDialog.tsx  # 対局記録の作成・編集
│   ├── RecordsChart.tsx      # 戦績グラフ
│   ├── RecordsView.tsx       # 戦績タブ
│   ├── ScoreDisplay.tsx      # 点数表示
│   └── YakuButton.tsx        # 役選択ボタン
├── contexts/                 # 認証コンテキスト
├── data/
│   └── yaku.ts               # 役マスタ
├── lib/
│   ├── games.ts              # Supabaseの対局記録CRUD
│   └── supabaseClient.ts     # Supabaseクライアント
├── types/                    # 型定義
├── utils/
│   └── scoreCalculator.ts    # 点数・符計算ロジック
├── App.tsx                   # アプリ本体
└── main.tsx                  # エントリーポイント

tests/
└── e2e/
    └── score-calculator.spec.ts
```

## 点数計算ロジック

### 役選択モード

役選択モードでは、選択された役の翻数、ドラ、鳴きによる食い下がり、門前ツモの自動加算、大三元の役満判定などをまとめて処理します。

符は初心者向けの簡易判定として以下を使います。

1. 七対子を選択: 25符
2. 平和 + ツモ: 20符
3. 平和 + ロン: 30符
4. 鳴きなし + ロン: 40符
5. その他: 30符

### 翻符入力モード

翻数と符を直接指定して点数を計算します。符が分からない場合は、下段の符計算補助で算出した符を自動反映できます。

符計算補助では以下を扱います。

- 基本符 20符
- ツモ 2符
- 門前ロン 10符
- 単騎 / ペンチャン / カンチャン 2符
- 役牌雀頭 2符
- 么九牌・字牌 / 中張牌の刻子・槓子
- 平和、七対子の固定符
- 面子数の上限チェック
- 4翻以上では補助UIを停止

## 戦績機能

ログイン後、対局結果を `games` テーブルに保存できます。

保存項目:

- ルール: 4麻 / 3麻
- 最終素点
- 順位
- ジャンル: フリー5 / フリー1 / 友人
- 対局日時
- メモ

表示機能:

- 直近30件の履歴
- 編集 / 削除
- ジャンルフィルタ
- 直近 5 / 10 / 30 戦の折れ線グラフ
- 高得点トップの ★ 表示

## セットアップ

### 1. 依存関係をインストール

```bash
npm install
```

### 2. 環境変数を設定

`.env.example` を `.env.local` にコピーし、Supabase の値を設定します。

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>

# Cloudflare Turnstile site key
# 本番では設定推奨。ローカルでは未設定でもゲストログインUIは動作します。
VITE_TURNSTILE_SITE_KEY=
```

### 3. Supabase認証を設定

Supabase Dashboard で以下を設定します。

- Authentication Providers で Google を有効化
- Anonymous Sign-Ins を有効化
- URL Configuration の Site URL に `http://localhost:5173` と本番URLを設定
- Google OAuth のリダイレクトURIに Supabase の callback URL を登録

### 4. 対局記録テーブルを作成

Supabase Dashboard の SQL Editor で以下を実行します。

```sql
create table public.games (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  played_at   timestamptz not null default now(),
  ruleset     text not null check (ruleset in ('4ma','3ma')),
  score       integer not null,
  rank        smallint not null check (rank between 1 and 4),
  genre       text not null check (genre in ('free_5','free_1','friend')),
  memo        text,
  created_at  timestamptz not null default now()
);

alter table public.games
  add constraint games_rank_matches_ruleset
  check (
    (ruleset = '4ma' and rank between 1 and 4) or
    (ruleset = '3ma' and rank between 1 and 3)
  );

create index games_user_played_at_idx
  on public.games (user_id, played_at desc);

alter table public.games enable row level security;

create policy "games_select_own" on public.games
  for select using (auth.uid() = user_id);

create policy "games_insert_own" on public.games
  for insert with check (auth.uid() = user_id);

create policy "games_update_own" on public.games
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "games_delete_own" on public.games
  for delete using (auth.uid() = user_id);
```

## 開発コマンド

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

## テスト方針

- `src/utils/scoreCalculator.test.ts`
  - 翻符からの点数計算
  - 満貫以上の判定
  - 符計算補助
  - 食い下がり
  - 大三元の役満判定

- `src/lib/games.test.ts`
  - Supabase CRUD の呼び出し
  - snake_case / camelCase 変換
  - エラー処理
  - ★ 表示条件

- `tests/e2e/score-calculator.spec.ts`
  - 役選択モードの主要操作
  - 翻符入力モード
  - 符計算補助
  - モード切替時の状態保持

## 現在の制限

- Supabase環境変数が未設定の場合、アプリ起動時にエラーになります。
- Service Worker は登録されていますが、オフライン用のキャッシュ戦略はまだ実装していません。
- 役選択モードの符は初心者向けの簡易判定です。細かい符計算は翻符入力モードの符計算補助で扱います。

## ライセンス

MIT
