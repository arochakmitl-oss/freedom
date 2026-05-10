create table if not exists public.freedom_profiles (
  username text primary key,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.freedom_profiles enable row level security;

create policy "Allow anon read profiles"
on public.freedom_profiles
for select
to anon
using (true);

create policy "Allow anon upsert profiles"
on public.freedom_profiles
for insert
to anon
with check (true);

create policy "Allow anon update profiles"
on public.freedom_profiles
for update
to anon
using (true)
with check (true);
