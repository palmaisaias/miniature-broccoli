create table if not exists public.family_bracket_users (
  id text primary key,
  username text not null unique,
  display_name text not null,
  password_hash text not null,
  salt text not null,
  created_at timestamptz not null
);

create table if not exists public.family_bracket_sessions (
  token text primary key,
  user_id text not null references public.family_bracket_users(id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists public.family_bracket_picks (
  user_id text not null references public.family_bracket_users(id) on delete cascade,
  match_id text not null,
  winner text not null,
  updated_at timestamptz not null,
  primary key (user_id, match_id)
);

create table if not exists public.family_bracket_results (
  match_id text primary key,
  status text not null check (status in ('scheduled', 'in_progress', 'final', 'unknown')),
  winner text,
  home_score integer,
  away_score integer,
  note text,
  source_url text,
  updated_at timestamptz not null
);

create index if not exists family_bracket_sessions_user_id_idx
  on public.family_bracket_sessions(user_id);

create index if not exists family_bracket_picks_user_id_idx
  on public.family_bracket_picks(user_id);

alter table public.family_bracket_users enable row level security;
alter table public.family_bracket_sessions enable row level security;
alter table public.family_bracket_picks enable row level security;
alter table public.family_bracket_results enable row level security;
