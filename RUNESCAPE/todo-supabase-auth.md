# RuneScape Habit Tracker - Supabase & Auth Implementation

**Date:** January 9, 2026

---

## Priority 1: Supabase Setup ✅

### Project Configuration
- [x] Create Supabase project at supabase.com
- [x] Note down project URL and anon key
- [x] Install `@supabase/supabase-js` package
- [x] Create `src/lib/supabase.js` client configuration
- [x] Add environment variables to `.env.local`
- [x] Add `.env.local` to `.gitignore`
- [x] Configure Vercel environment variables

### Database Schema
- [x] Create `profiles` table (id, username, avatar_url, created_at)
- [x] Create `habits` table (id, user_id, name, icon, type, xp, level, streak, created_at)
- [x] Create `completions` table (id, habit_id, user_id, completed_at, xp_gained)
- [x] Create `timer_sessions` table (id, habit_id, user_id, started_at, ended_at, duration)
- [x] Set up Row Level Security (RLS) policies
- [x] Create foreign key relationships
- [x] Add indexes for performance (user_id, completed_at)

---

## Priority 2: Authentication ✅

### OAuth Providers Setup
- [x] Enable Google OAuth in Supabase dashboard
- [x] Configure Google Cloud Console OAuth credentials
- [x] Add authorized redirect URIs to Google
- [ ] Enable Discord OAuth in Supabase dashboard (optional)
- [ ] Configure Discord Developer Portal (optional)
- [ ] Enable GitHub OAuth in Supabase dashboard (optional)

### Auth UI Components
- [x] Create `src/components/Auth/LoginModal.jsx`
- [x] Create `src/components/Auth/UserMenu.jsx`
- [x] Add login/logout buttons to header
- [x] Create `src/hooks/useAuth.js` hook
- [x] Add auth state context provider
- [x] Handle auth state changes (onAuthStateChange)
- [x] Add loading state during auth check
- [x] Style login modal to match OSRS theme

### Auth Flow
- [x] Implement `signInWithOAuth` for Google
- [x] Implement `signOut` function
- [x] Handle OAuth callback/redirect
- [x] Auto-create profile on first login (via DB trigger)
- [x] Add error handling for auth failures
- [x] Add "Remember me" / persistent sessions

---

## Priority 3: Data Migration & Sync

### Local to Cloud Migration
- [ ] Create migration utility for existing localStorage data
- [ ] Prompt user to migrate data on first login
- [ ] Map localStorage habits to database schema
- [ ] Preserve XP, levels, and streaks during migration
- [ ] Delete localStorage after successful migration
- [ ] Handle migration errors gracefully

### Real-time Sync
- [ ] Replace localStorage reads with Supabase queries
- [ ] Replace localStorage writes with Supabase inserts/updates
- [ ] Add optimistic updates for better UX
- [ ] Implement offline detection
- [ ] Queue offline changes for sync when back online
- [ ] Add sync status indicator

### Data Operations
- [ ] Create `src/hooks/useHabits.js` for CRUD operations
- [ ] Implement `fetchHabits()` - load user habits
- [ ] Implement `createHabit()` - add new habit
- [ ] Implement `updateHabit()` - modify habit
- [ ] Implement `deleteHabit()` - remove habit
- [ ] Implement `completeHabit()` - record completion
- [ ] Implement `getCompletionHistory()` - for heatmap

---

## Priority 4: Security & Polish

### Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Policy: Users can only read own habits
- [ ] Policy: Users can only insert own habits
- [ ] Policy: Users can only update own habits
- [ ] Policy: Users can only delete own habits
- [ ] Policy: Users can only read own completions
- [ ] Test RLS policies thoroughly

### Error Handling
- [ ] Add error boundaries for auth failures
- [ ] Add retry logic for failed requests
- [ ] Show user-friendly error messages
- [ ] Log errors for debugging
- [ ] Handle session expiry gracefully

### UX Improvements
- [ ] Add loading skeletons while fetching data
- [ ] Show sync status (synced/syncing/offline)
- [ ] Add "Sign in to save progress" prompt for guests
- [ ] Allow guest mode with localStorage fallback
- [ ] Add account settings page (future)

---

## Database Schema Reference

```sql
-- Profiles table
create table profiles (
  id uuid references auth.users primary key,
  username text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Habits table
create table habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  icon text not null,
  type text check (type in ('daily', 'timed')) default 'daily',
  xp integer default 0,
  level integer default 1,
  streak integer default 0,
  last_completed date,
  timer_start timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Completions table (for heatmap history)
create table completions (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references habits(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  completed_at timestamp with time zone default now(),
  xp_gained integer default 0
);

-- RLS Policies
alter table profiles enable row level security;
alter table habits enable row level security;
alter table completions enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view own habits"
  on habits for select using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on habits for insert with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on habits for update using (auth.uid() = user_id);

create policy "Users can delete own habits"
  on habits for delete using (auth.uid() = user_id);
```

---

## Files to Create

- [x] `src/lib/supabase.js` - Supabase client
- [x] `src/context/AuthContext.jsx` - Auth state provider
- [x] `src/hooks/useAuth.js` - Auth hook
- [ ] `src/hooks/useHabits.js` - Habits CRUD hook
- [x] `src/components/Auth/LoginModal.jsx` - Login UI
- [x] `src/components/Auth/UserMenu.jsx` - User dropdown
- [ ] `src/utils/migration.js` - localStorage migration
- [x] `.env.local` - Environment variables

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Completion Tracking

| Priority | Total Tasks | Completed |
|----------|-------------|-----------|
| P1 - Supabase Setup | 14 | 14 |
| P2 - Authentication | 18 | 15 |
| P3 - Data Sync | 16 | 0 |
| P4 - Security & Polish | 15 | 0 |
| Files to Create | 8 | 6 |
| **Total** | **71** | **35** |
