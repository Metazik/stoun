-- STOUN — initial schema
-- Postgres/Supabase. Run via `supabase db push` or paste into the SQL editor.
--
-- Design notes:
-- * `profiles` mirrors `auth.users` 1:1 (created by the `handle_new_user` trigger).
-- * `projects` are always private working sessions (Studio); `posts` are the public,
--   published artifacts derived from a project. This is what lets a private
--   in-progress remix stay invisible until the artist actually publishes it.
-- * `audio_files` stores every audio asset (original recording, processed stems,
--   final master) so the AVANT/APRÈS player can always diff two concrete files.
-- * `generations` is an append-only log of every AudioEngine call (real or mocked)
--   made against a project — useful for debugging and, later, for billing usage.
-- * `subscriptions` exists for the FREE/PRO/CREATOR architecture only; no Stripe
--   wiring happens in the MVP (see cahier des charges, "Monétisation future").

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------------
create type public.plan_tier as enum ('free', 'pro', 'creator');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  plan public.plan_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_.]{3,30}$')
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'display_name', 'New Artist')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- PROJECTS  (private Studio sessions)
-- ---------------------------------------------------------------------------
create type public.project_source as enum ('record', 'upload', 'song');
create type public.project_status as enum ('draft', 'processing', 'ready', 'published');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled Stoun',
  source_type public.project_source not null,
  status public.project_status not null default 'draft',
  tags text[] not null default '{}',
  instruction text,
  keep_my_voice boolean not null default true,
  vocal_settings jsonb not null default '{}'::jsonb,
  music_settings jsonb not null default '{}'::jsonb,
  original_audio_file_id uuid,
  current_audio_file_id uuid,
  remix_of_post_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AUDIO FILES
-- ---------------------------------------------------------------------------
create type public.audio_kind as enum ('original', 'stem', 'processed', 'master');

create table public.audio_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind public.audio_kind not null,
  label text,
  storage_bucket text not null default 'private-projects',
  storage_path text not null,
  duration_seconds numeric,
  is_mocked boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.projects
  add constraint projects_original_audio_fk
    foreign key (original_audio_file_id) references public.audio_files (id) on delete set null,
  add constraint projects_current_audio_fk
    foreign key (current_audio_file_id) references public.audio_files (id) on delete set null;

-- ---------------------------------------------------------------------------
-- GENERATIONS  (AudioEngine call log)
-- ---------------------------------------------------------------------------
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  engine_function text not null,
  params jsonb not null default '{}'::jsonb,
  status text not null default 'completed',
  is_mocked boolean not null default true,
  result_audio_file_id uuid references public.audio_files (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- POSTS  (public feed items)
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  artwork_url text,
  clip_duration_seconds int not null default 15 check (clip_duration_seconds in (5, 10, 15)),
  audio_file_id uuid not null references public.audio_files (id),
  hashtags text[] not null default '{}',
  remix_of_post_id uuid references public.posts (id) on delete set null,
  created_at timestamptz not null default now()
);

create index posts_author_idx on public.posts (author_id);
create index posts_created_idx on public.posts (created_at desc);

-- ---------------------------------------------------------------------------
-- LIKES
-- ---------------------------------------------------------------------------
create table public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ---------------------------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id);

-- ---------------------------------------------------------------------------
-- FOLLOWS
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------------
-- REMIXES
-- ---------------------------------------------------------------------------
create table public.remixes (
  id uuid primary key default gen_random_uuid(),
  original_post_id uuid not null references public.posts (id) on delete cascade,
  remix_project_id uuid not null references public.projects (id) on delete cascade,
  remix_post_id uuid references public.posts (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------
create type public.notification_type as enum ('like', 'comment', 'follow', 'remix', 'publish');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  actor_id uuid references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, read, created_at desc);

-- ---------------------------------------------------------------------------
-- SUBSCRIPTIONS  (architecture only — no Stripe wiring in the MVP)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  plan public.plan_tier not null default 'free',
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.audio_files enable row level security;
alter table public.generations enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.remixes enable row level security;
alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;

-- profiles: public read, owner write
create policy "profiles are publicly readable" on public.profiles
  for select using (true);
create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- projects: private to the owner (this is where "keep my voice" work-in-progress lives)
create policy "owners can manage their projects" on public.projects
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- audio_files: owner via project, OR anyone if the file backs a public post
create policy "owners can manage their audio files" on public.audio_files
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );
create policy "published audio files are publicly readable" on public.audio_files
  for select using (
    exists (select 1 from public.posts po where po.audio_file_id = audio_files.id)
  );

-- generations: owner via project only
create policy "owners can manage their generations" on public.generations
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- posts: public read, owner write
create policy "posts are publicly readable" on public.posts
  for select using (true);
create policy "authors can manage their posts" on public.posts
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- likes: public read, self write
create policy "likes are publicly readable" on public.likes
  for select using (true);
create policy "users can like as themselves" on public.likes
  for insert with check (auth.uid() = user_id);
create policy "users can unlike their own like" on public.likes
  for delete using (auth.uid() = user_id);

-- comments: public read, self write, author or post owner can delete
create policy "comments are publicly readable" on public.comments
  for select using (true);
create policy "users can comment as themselves" on public.comments
  for insert with check (auth.uid() = user_id);
create policy "users can delete their own comments" on public.comments
  for delete using (
    auth.uid() = user_id
    or auth.uid() in (select author_id from public.posts where id = post_id)
  );

-- follows: public read, self write
create policy "follows are publicly readable" on public.follows
  for select using (true);
create policy "users can follow as themselves" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "users can unfollow as themselves" on public.follows
  for delete using (auth.uid() = follower_id);

-- remixes: public read, self write
create policy "remixes are publicly readable" on public.remixes
  for select using (true);
create policy "users can remix as themselves" on public.remixes
  for insert with check (auth.uid() = user_id);

-- notifications: private to the recipient
create policy "users can read their own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "users can mark their own notifications read" on public.notifications
  for update using (auth.uid() = user_id);

-- subscriptions: private to the owner, read-only from the client
-- (writes happen from a service-role key once Stripe is connected)
create policy "users can read their own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- STORAGE BUCKETS
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('public-posts', 'public-posts', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('private-projects', 'private-projects', false)
on conflict (id) do nothing;

create policy "public-posts assets are publicly readable"
  on storage.objects for select
  using (bucket_id = 'public-posts');

create policy "authenticated users can upload to public-posts"
  on storage.objects for insert
  with check (bucket_id = 'public-posts' and auth.role() = 'authenticated');

create policy "owners can manage their private-projects files"
  on storage.objects for all
  using (bucket_id = 'private-projects' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'private-projects' and (storage.foldername(name))[1] = auth.uid()::text);
