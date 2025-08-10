-- Sprint 1: Tenant skeleton (no RLS yet)

-- Use pgcrypto for UUIDs (already installed)
-- Roles are text with a CHECK to keep it flexible (vs hard enums)
create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','inspector','viewer')),
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  created_at timestamptz not null default now(),
  unique (contractor_id, user_id)
);

create index if not exists idx_memberships_contractor on public.memberships (contractor_id);
create index if not exists idx_memberships_user on public.memberships (user_id);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  email text not null,
  token text not null unique,
  role text not null check (role in ('owner','admin','inspector','viewer')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_invites_contractor on public.invites (contractor_id);
create index if not exists idx_invites_email on public.invites (email);
