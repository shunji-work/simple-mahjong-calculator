-- 対局記録テーブル games と RLS ポリシー
--
-- 新規プロジェクト・既存プロジェクトのどちらに流しても安全なように、
-- 可能な限り冪等（if not exists / drop policy if exists）にしている。
-- 値の上限はアプリ側の src/lib/gameValidation.ts と揃えること。
--   score: -999900 〜 999900、100点単位
--   memo : 200文字以内
--   rank : 4麻は 1〜4、3麻は 1〜3

create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  played_at   timestamptz not null default now(),
  ruleset     text not null check (ruleset in ('4ma','3ma')),
  score       integer not null,
  rank        smallint not null check (rank between 1 and 4),
  genre       text not null check (genre in ('free_5','free_1','friend')),
  memo        text,
  created_at  timestamptz not null default now()
);

-- 既存テーブル（README の旧手順で作成済み）にも default を設定する
alter table public.games alter column user_id set default auth.uid();

-- 追加の CHECK 制約。既存テーブルに既存行があっても失敗しないよう NOT VALID で追加する
-- （新規の INSERT / UPDATE には適用される。既存行も検証する場合は
--   alter table public.games validate constraint <name>; を実行する）
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'games_rank_matches_ruleset' and conrelid = 'public.games'::regclass
  ) then
    alter table public.games
      add constraint games_rank_matches_ruleset
      check (
        (ruleset = '4ma' and rank between 1 and 4) or
        (ruleset = '3ma' and rank between 1 and 3)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'games_score_range' and conrelid = 'public.games'::regclass
  ) then
    alter table public.games
      add constraint games_score_range
      check (score between -999900 and 999900 and score % 100 = 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'games_memo_length' and conrelid = 'public.games'::regclass
  ) then
    alter table public.games
      add constraint games_memo_length
      check (memo is null or char_length(memo) <= 200) not valid;
  end if;
end
$$;

create index if not exists games_user_played_at_idx
  on public.games (user_id, played_at desc);

-- Row Level Security: 本人の行だけを読み書きできる
-- （匿名ゲストも Supabase 上は authenticated ロールで、auth.uid() を持つ）
alter table public.games enable row level security;

drop policy if exists "games_select_own" on public.games;
create policy "games_select_own" on public.games
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "games_insert_own" on public.games;
create policy "games_insert_own" on public.games
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "games_update_own" on public.games;
create policy "games_update_own" on public.games
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "games_delete_own" on public.games;
create policy "games_delete_own" on public.games
  for delete to authenticated
  using ((select auth.uid()) = user_id);
