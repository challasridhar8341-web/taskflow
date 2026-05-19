-- ============================================================
-- TaskFlow Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  avatar_url  text,
  department  text,
  created_at  timestamptz default now()
);

-- 2. PROJECTS
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text default '#6366f1',
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

-- 3. TASKS
create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  status       text not null default 'todo'
               check (status in ('todo','in_progress','in_review','done')),
  priority     text not null default 'medium'
               check (priority in ('low','medium','high')),
  due_date     date,
  project_id   uuid references projects(id) on delete set null,
  assigned_to  uuid not null references profiles(id),
  assigned_by  uuid not null references profiles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 4. ACTIVITY LOG
create table if not exists activity (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references tasks(id) on delete cascade,
  user_id    uuid references profiles(id),
  action     text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (everyone in org can read/write tasks)
-- ============================================================
alter table profiles enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table activity enable row level security;

-- Profiles: authenticated users can read all, update their own
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_insert" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on profiles for update to authenticated using (auth.uid() = id);

-- Projects: all authenticated can read/create
create policy "projects_select" on projects for select to authenticated using (true);
create policy "projects_insert" on projects for insert to authenticated with check (true);

-- Tasks: all authenticated can read/create/update
create policy "tasks_select" on tasks for select to authenticated using (true);
create policy "tasks_insert" on tasks for insert to authenticated with check (true);
create policy "tasks_update" on tasks for update to authenticated using (true);
create policy "tasks_delete" on tasks for delete to authenticated using (
  assigned_by = auth.uid()
);

-- Activity: all can read, insert own
create policy "activity_select" on activity for select to authenticated using (true);
create policy "activity_insert" on activity for insert to authenticated with check (user_id = auth.uid());

-- ============================================================
-- AUTO-UPDATE updated_at on tasks
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- SEED: Sample projects
-- ============================================================
insert into projects (name, color) values
  ('Website Redesign', '#6366f1'),
  ('Mobile App v2', '#22c55e'),
  ('Q3 Marketing', '#f59e0b'),
  ('HR Onboarding', '#ec4899')
on conflict do nothing;
