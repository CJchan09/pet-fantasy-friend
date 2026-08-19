-- Pet Fantasy Friend — 账号系统数据库结构
-- 在 Supabase Dashboard → SQL Editor 里整段贴入执行一次即可。
-- 之后 schema 有变动会在这个文件里累加注释说明，重新贴入执行（用了 IF NOT EXISTS / OR REPLACE，可重复跑）。

-- profiles：一个用户一行，game_state 直接存整个 AppState（跟 localStorage 现在存的 JSON 结构一致），
-- 不拆成 reflections/tasks/... 多张表——这是把现有「单一 JSON blob」持久化模式原样搬到云端，
-- 改动面最小，不用重新设计整个数据模型。
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  game_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 新用户注册（auth.users 新增一行）时自动建一行 profiles，默认 role='user'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 关键防线：role 字段任何「已登录用户发起」的 UPDATE 一律摁回旧值，
-- 不管前端代码写没写对，靠这条数据库层规则挡死「用户把自己改成 admin」这条路——
-- 只有拿 service_role key 在后台/SQL Editor 里跑的更新（auth.uid() 为 null）才能真正改 role。
create or replace function public.prevent_role_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_role_self_update on public.profiles;
create trigger prevent_role_self_update
  before update on public.profiles
  for each row execute function public.prevent_role_self_update();

-- ============================================================
-- 下面这条不是 schema 的一部分，是给 CJ 自己手动跑的：
-- 注册完账号后，把邮箱换成你自己登录用的那个，跑一次，把自己设成 admin 测试账号。
-- ============================================================
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'your-email@example.com');
