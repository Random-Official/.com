create table if not exists public.profiles (
  id text primary key,
  auth_user_id uuid unique,
  username text not null default '',
  email text not null default '',
  bio text not null default '',
  avatar_url text not null default '',
  following jsonb not null default '[]'::jsonb,
  notifications jsonb not null default '[]'::jsonb,
  bookmarks jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  profile_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id text primary key,
  user_id text not null,
  content text not null default '',
  image_url text not null default '',
  hashtags jsonb not null default '[]'::jsonb,
  category text not null default 'general',
  created_at_ms bigint not null default 0,
  post_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

drop policy if exists "profiles readable by everyone" on public.profiles;
create policy "profiles readable by everyone" on public.profiles for select using (true);

drop policy if exists "posts readable by everyone" on public.posts;
create policy "posts readable by everyone" on public.posts for select using (true);

drop policy if exists "profiles insert own row" on public.profiles;
create policy "profiles insert own row" on public.profiles for insert with check (auth.uid() = auth_user_id);

drop policy if exists "profiles update own row" on public.profiles;
create policy "profiles update own row" on public.profiles for update using (auth.uid() = auth_user_id);

drop policy if exists "posts insert signed in" on public.posts;
create policy "posts insert signed in" on public.posts for insert with check (auth.role() = 'authenticated');

drop policy if exists "posts update signed in" on public.posts;
create policy "posts update signed in" on public.posts for update using (auth.role() = 'authenticated');

create index if not exists profiles_auth_user_id_idx on public.profiles(auth_user_id);
create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_created_at_ms_idx on public.posts(created_at_ms desc);
