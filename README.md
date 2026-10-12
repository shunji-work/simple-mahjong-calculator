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
- **PWA**: ホーム画面への追加と、一度開いたあとのオフラインでの点数計算に対応（初回訪問時に画面・アセットをすべて事前キャッシュ）

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
│   ├── YakuButton.tsx        # 役選択ボタン
│   └── ErrorBoundary.tsx     # 描画エラーの受け皿（画面が真っ白になるのを防ぐ）
├── contexts/                 # 認証コンテキスト
├── hooks/
│   ├── useYakuMode.ts        # 役選択モードの状態と操作
│   └── useManualMode.ts      # 翻符入力モード・符計算補助の状態と操作
├── data/
│   └── yaku.ts               # 役マスタ
├── lib/
│   ├── games.ts              # Supabaseの対局記録CRUD
│   ├── gameValidation.ts     # 対局記録の入力チェック
│   └── supabaseClient.ts     # Supabaseクライアント
├── types/                    # 型定義（database.ts は Supabase の DB 型）
├── utils/
│   └── scoreCalculator.ts    # 点数・符計算ロジック
├── App.tsx                   # 画面の組み立て（状態とロジックは hooks/ に置く）
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
- 切り上げ満貫あり（4翻30符、3翻60符）

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

テーブル定義・CHECK 制約・RLS ポリシーは
[`supabase/migrations/20261009000000_create_games.sql`](supabase/migrations/20261009000000_create_games.sql)
にまとめています。以下のいずれかで適用してください。

- Supabase CLI を使う場合: `supabase link --project-ref <project-ref>` の後に `supabase db push`
- Dashboard を使う場合: SQL Editor にマイグレーションファイルの内容を貼り付けて実行

マイグレーションの内容:

- `public.games` テーブル（`user_id` は `auth.uid()` がデフォルト）
- CHECK 制約: ルール別の順位範囲、素点は -999,900〜999,900 かつ100点単位、メモは200文字以内
  （アプリ側の入力チェック `src/lib/gameValidation.ts` と同じ値）
- `(user_id, played_at desc)` インデックス
- RLS を有効化し、SELECT / INSERT / UPDATE / DELETE とも本人（`auth.uid() = user_id`）の行のみ許可

既存の環境（旧 README の SQL で作成済み）に流しても失敗しないよう冪等に書いてあり、
追加の CHECK 制約は `NOT VALID` で付与されます（新規の書き込みにのみ適用）。

## 開発コマンド

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run gen:types   # Supabase の DB 型を再生成（下記参照）
```

### CI

`.github/workflows/ci.yml` で、main への push と PR のたびに
型チェック → lint → 単体テスト → ビルド → E2E テストを実行します。

### DB 型の再生成

`src/types/database.ts` は Supabase の型生成と同じ形式の DB 型です。
マイグレーションでスキーマを変えたら再生成してください。
Supabase CLI は devDependencies に入っているので、別途インストールは不要です。
`your-project-ref` は Supabase のプロジェクト ID（`VITE_SUPABASE_URL` の `https://<ここ>.supabase.co` の部分）に置き換えます。

```bash
npx supabase login
SUPABASE_PROJECT_ID=your-project-ref npm run gen:types
```

生成に失敗した場合、既存の `src/types/database.ts` はそのまま残ります。

## テスト方針

- `src/utils/scoreTable.test.ts`
  - 点数早見表（1〜4翻 × 20〜110符 × 親子 × ツモロン）と満貫以上の全組み合わせの突き合わせ
  - 実在しない翻符の組み合わせの判定

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

- `src/lib/gameValidation.dbSync.test.ts`
  - アプリ側の入力チェックとマイグレーションの CHECK 制約の値が一致しているか

- `tests/e2e/score-calculator.spec.ts`
  - 役選択モードの主要操作
  - 翻符入力モード
  - 符計算補助
  - モード切替時の状態保持
  - 戦績タブの読み込みに失敗しても点数計算が使えること

## 現在の制限

- Supabase環境変数が未設定の場合、ログイン・戦績機能は無効になります（点数計算は利用できます）。
- オフラインで使えるのは点数計算のみです。戦績の閲覧・保存とログインにはネットワーク接続が必要です。
- 新しいバージョンは裏でダウンロードされ、アプリ（全タブ）を一度閉じて開き直したときに反映されます。
- 役選択モードの符は初心者向けの簡易判定です。細かい符計算は翻符入力モードの符計算補助で扱います。

## ライセンス

MIT
