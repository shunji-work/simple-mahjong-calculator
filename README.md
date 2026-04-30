# 麻雀かんたん計算機

初心者向けの麻雀点数計算ツールです。役をボタンで選ぶだけで、符計算を自動化し、点数を瞬時に表示します。

## 主な特徴

- **符計算の自動判定**: ユーザーに符を聞かず、あがり方と役の組み合わせから自動で符を決定
- **出る順UI**: 出現頻度の高い役（リーチ、タンヤオ等）を上位に配置
- **直感的なスコア表示**: ツモ時の支払い内訳（親・子）を即座に提示
- **メンゼン限定役の自動無効化**: 鳴きありを選択時、メンゼン限定役が自動で無効化
- **レスポンシブ対応**: モバイルからデスクトップまで最適表示

## 技術スタック

### フロントエンド
- **React 18.3.1**: コンポーネントベースのUI構築
- **TypeScript 5.5.3**: 型安全な開発
- **Vite 5.4.2**: 高速なビルドツール
- **Tailwind CSS 3.4.1**: ユーティリティファーストのCSS
- **Lucide React 0.344.0**: モダンなアイコンライブラリ

### バックエンド（将来実装予定）
- **Supabase 2.57.4**: 認証、データベース、ストレージ

### 開発ツール
- **ESLint**: コード品質の維持
- **PostCSS**: CSS処理
- **Autoprefixer**: ブラウザ対応の自動化

## プロジェクト構造

```
src/
├── components/          # UIコンポーネント
│   ├── YakuButton.tsx   # 役選択ボタン
│   └── ScoreDisplay.tsx # 点数表示
├── data/                # マスターデータ
│   └── yaku.ts          # 役の定義とカテゴリ分け
├── types/               # TypeScript型定義
│   └── mahjong.ts       # 麻雀関連の型
├── utils/               # ユーティリティ
│   └── scoreCalculator.ts # 点数計算ロジック
├── App.tsx              # メインアプリケーション
├── main.tsx             # エントリーポイント
└── index.css            # グローバルスタイル
```

## サイトマップ

```
麻雀かんたん計算機
│
├── ヘッダー
│   └── タイトルとロゴ
│
├── メインコンテンツ
│   ├── 左側（役選択エリア）
│   │   ├── あがり方選択（ツモ/ロン）
│   │   ├── 状態選択（鳴き有無/親子/リセット）
│   │   ├── 頻出役（Sランク）
│   │   ├── 中級役（Aランク）
│   │   ├── 上級役（Bランク）
│   │   └── 役満（Cランク）
│   │
│   └── 右側（スコア表示エリア）
│       ├── 点数表示
│       │   ├── 役名・翻数・符数
│       │   ├── ツモ時の支払い内訳
│       │   └── 合計獲得点
│       └── 選択中の役一覧
│
└── フッター
    └── 説明文
```

## 点数計算ロジック

### 符の自動判定
1. 七対子を選択 → 25符
2. 平和+ツモを同時に選択 → 20符
3. 鳴きなし+ロンを選択 → 40符
4. その他 → 30符

### 役のカテゴリ
- **Sランク（頻出役）**: リーチ、タンヤオ、平和、ツモ、役牌、ドラ
- **Aランク（中級役）**: 一盃口、七対子、対々和、三色同順、一気通貫
- **Bランク（上級役）**: 混一色、純全帯、清一色
- **Cランク（役満）**: 役満一括

### スコア算出
- 1〜4翻: 判定された符と翻数に基づき点数表から取得
- 5翻以上: 符に関係なく固定点（満貫以上）を表示

## 今後の実装予定

- **Supabase連携**
  - ~~ユーザー認証機能~~（実装済: Google OAuth + ゲストサインイン）
  - ~~対局結果の記録（点数・順位・ジャンル）と履歴一覧~~（実装済: Phase 1）
  - 直近 5 / 10 / 30 戦の折れ線グラフ + 高得点トップに ★ マーク（Phase 2 予定）
  - ジャンルフィルタ（フリー5 / フリー1 / フリー総合 / 友人）（Phase 3 予定）
  - よく使う役の統計機能

- **追加機能**
  - 点数計算の履歴表示
  - カスタム役の追加
  - オフラインモード対応
  - PWA化

## デザインコンセプト

- **麻雀卓の緑**: 深い緑色（#1a5928、#2d7c3d）を基調とした背景
- **視認性の高いデジタル文字**: 点数を明確に表示するモダンなフォント
- **インタラクティブな挙動**:
  - 鳴き選択時にメンゼン限定役を自動無効化
  - ロン選択時にツモ役を自動除外
  - 選択状態を視覚的にフィードバック

## セットアップ

このアプリは認証に Supabase を使います。初回起動には以下が必要です。

### 1. Supabase プロジェクトを用意

1. https://supabase.com で新規プロジェクトを作成（リージョンは Tokyo `ap-northeast-1` 推奨）
2. **Authentication → Providers → Google** を有効化
   - 別途 Google Cloud Console で OAuth クライアント ID を作成し、承認済みリダイレクト URI に Supabase 側で表示される `https://<project-ref>.supabase.co/auth/v1/callback` を登録
   - 取得した Client ID / Client Secret を Supabase に登録
3. **Authentication → Providers → Anonymous Sign-Ins** を有効化（ゲスト利用に必要）
4. **Authentication → URL Configuration** で Site URL に `http://localhost:5173`（および本番 URL）を設定

### 2. 環境変数を設定

`.env.example` を `.env.local` にコピーし、Supabase の **Project Settings → API** から取得した値を入れます。

```bash
cp .env.example .env.local
# .env.local を編集
# VITE_SUPABASE_URL=https://<project-ref>.supabase.co
# VITE_SUPABASE_ANON_KEY=<anon public key>
```

`.env.local` は `.gitignore` で除外されているため、コミットされません。

### 3. 対局記録テーブルを作成

戦績タブで対局を保存するために、Supabase 側に `games` テーブルと RLS ポリシーを作成します。

**手順**: Supabase Dashboard → 左サイドバー **「SQL Editor」** → **「+ New query」** → 下記 SQL を貼り付けて **「Run」**

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

`Success. No rows returned` と出れば完了です。Table Editor に `public.games`（4 RLS policies 付き）が見えていることを確認してください。

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
npm run preview
```

## ライセンス

MIT
