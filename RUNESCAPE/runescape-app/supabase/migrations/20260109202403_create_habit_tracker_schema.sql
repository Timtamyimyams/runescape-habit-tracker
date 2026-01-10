-- ============================================
-- RuneScape Habit Tracker Database Schema
-- ============================================

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habits table
create table public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  icon text not null,
  type text check (type in ('daily', 'timed')) default 'daily' not null,
  xp integer default 0 not null,
  level integer default 1 not null,
  streak integer default 0 not null,
  last_completed date,
  timer_start timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Completions table (for heatmap/history)
create table public.completions (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  xp_gained integer default 0 not null
);

-- Timer sessions table
create table public.timer_sessions (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  duration integer, -- in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Indexes for performance
-- ============================================

create index habits_user_id_idx on public.habits(user_id);
create index completions_user_id_idx on public.completions(user_id);
create index completions_habit_id_idx on public.completions(habit_id);
create index completions_completed_at_idx on public.completions(completed_at);
create index timer_sessions_user_id_idx on public.timer_sessions(user_id);
create index timer_sessions_habit_id_idx on public.timer_sessions(habit_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.completions enable row level security;
alter table public.timer_sessions enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Habits policies
create policy "Users can view own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- Completions policies
create policy "Users can view own completions"
  on public.completions for select
  using (auth.uid() = user_id);

create policy "Users can insert own completions"
  on public.completions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own completions"
  on public.completions for delete
  using (auth.uid() = user_id);

-- Timer sessions policies
create policy "Users can view own timer sessions"
  on public.timer_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own timer sessions"
  on public.timer_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own timer sessions"
  on public.timer_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own timer sessions"
  on public.timer_sessions for delete
  using (auth.uid() = user_id);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_habits_updated_at
  before update on public.habits
  for each row execute procedure public.handle_updated_at();
