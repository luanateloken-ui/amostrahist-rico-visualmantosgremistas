-- Arquivo Digital do Grêmio — schema inicial Supabase/Postgres
create extension if not exists pgcrypto;

do $$ begin
  create type archive_kind as enum ('kit','crest','supplier','sponsor','event');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rights_status as enum ('open','permission','unknown','restricted');
exception when duplicate_object then null; end $$;

create table if not exists public.archive_items (
  id text primary key,
  kind archive_kind not null,
  year_start int not null check (year_start between 1800 and 2200),
  year_end int not null check (year_end between 1800 and 2200),
  title text not null,
  subtitle text,
  description text,
  variant text,
  manufacturer text,
  sponsor text,
  colors jsonb not null default '[]'::jsonb,
  source_url text,
  published boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  archive_item_id text not null references public.archive_items(id) on delete cascade,
  url text not null,
  thumb_url text,
  alt text,
  author text,
  license text,
  source_url text,
  rights_status rights_status not null default 'unknown',
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique(archive_item_id,url)
);

create table if not exists public.relations (
  id uuid primary key default gen_random_uuid(),
  from_item_id text not null references public.archive_items(id) on delete cascade,
  to_item_id text not null references public.archive_items(id) on delete cascade,
  relation_type text not null,
  label text,
  metadata jsonb not null default '{}'::jsonb,
  unique(from_item_id,to_item_id,relation_type)
);

create table if not exists public.sources (
  key text primary key,
  label text not null,
  base_url text,
  enabled boolean not null default true,
  last_sync_at timestamptz,
  notes text
);

create table if not exists public.design_settings (
  id text primary key default 'global',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists archive_items_year_idx on public.archive_items(year_start,year_end);
create index if not exists archive_items_kind_idx on public.archive_items(kind);
create index if not exists archive_items_published_idx on public.archive_items(published);
create index if not exists media_assets_item_idx on public.media_assets(archive_item_id);
create index if not exists relations_from_idx on public.relations(from_item_id);
create index if not exists relations_to_idx on public.relations(to_item_id);

alter table public.archive_items enable row level security;
alter table public.media_assets enable row level security;
alter table public.relations enable row level security;
alter table public.sources enable row level security;
alter table public.design_settings enable row level security;

drop policy if exists "public read published archive" on public.archive_items;
create policy "public read published archive" on public.archive_items for select using (published = true);
drop policy if exists "public read media for published" on public.media_assets;
create policy "public read media for published" on public.media_assets for select using (exists(select 1 from public.archive_items a where a.id=archive_item_id and a.published=true));
drop policy if exists "public read public relations" on public.relations;
create policy "public read public relations" on public.relations for select using (exists(select 1 from public.archive_items a where a.id=from_item_id and a.published=true) and exists(select 1 from public.archive_items b where b.id=to_item_id and b.published=true));
drop policy if exists "public read design" on public.design_settings;
create policy "public read design" on public.design_settings for select using (true);

insert into public.design_settings(id,settings) values ('global','{
  "background":"#090a0c","surface":"#12151a","ink":"#f4f7f8","accent":"#54c8f5","accent2":"#a4e6ff",
  "radius":28,"motion":"expressive","texture":"grain","displayFont":"Arial Black, Arial, sans-serif","bodyFont":"Inter, Arial, sans-serif"
}'::jsonb) on conflict (id) do nothing;
