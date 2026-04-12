-- Starter schema sketch

create table if not exists profiles (
  id text primary key,
  auth_user_id uuid unique,
  username text not null unique,
  email text,
  bio text default '',
  avatar_url text default '',
  settings jsonb default '{}'::jsonb,
  created_at bigint default extract(epoch from now()) * 1000
);

create table if not exists posts (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  author_name text,
  content text default '',
  image_url text default '',
  hashtags text[] default '{}',
  reply_permission text default 'everyone',
  likes integer default 0,
  created_at bigint not null
);

create table if not exists notifications (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  text text not null,
  read boolean default false,
  created_at bigint not null
);
