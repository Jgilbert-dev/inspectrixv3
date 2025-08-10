
-- s3_invites_hardened.sql

-- Make sure we can generate secure random tokens
create extension if not exists pgcrypto;

-- 1) Harden invites schema
alter table public.invites
  add column if not exists invited_email text,
  add column if not exists role text check (role in ('admin','user')) default 'user',
  add column if not exists max_uses int not null default 1,
  add column if not exists uses int not null default 0,
  add column if not exists expires_at timestamptz not null default now() + interval '7 days',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists consumed_by uuid references auth.users(id) on delete set null,
  add column if not exists consumed_at timestamptz,
  add column if not exists notes text;

-- Fast lookup & uniqueness
create unique index if not exists invites_token_uniq on public.invites (token);
create index if not exists invites_contractor_idx on public.invites (contractor_id);
create index if not exists invites_expires_idx on public.invites (expires_at);

-- 2) Helpers
create or replace function public.current_user_id()
returns uuid language sql stable as
$$ select auth.uid(); $$;

create or replace function public.is_contractor_admin(p_contractor_id uuid)
returns boolean language sql stable as
$$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.contractor_id = p_contractor_id
      and m.role in ('owner','admin')
  );
$$;

-- 3) RPC: admins create invites
create or replace function public.create_invite(
  p_contractor_id uuid,
  p_invited_email text default null,
  p_role text default 'user',
  p_ttl_minutes int default 1440,
  p_max_uses int default 1,
  p_notes text default null
)
returns table(id uuid, token text, expires_at timestamptz)
language plpgsql
security definer
as $$
declare
  v_token text := encode(gen_random_bytes(16), 'hex');
  v_exp timestamptz := now() + (p_ttl_minutes || ' minutes')::interval;
begin
  if not public.is_contractor_admin(p_contractor_id) then
    raise exception 'not_admin';
  end if;

  insert into public.invites (contractor_id, token, invited_email, role, max_uses, expires_at, created_by, notes)
  values (p_contractor_id, v_token, p_invited_email, p_role, p_max_uses, v_exp, auth.uid(), p_notes)
  returning id, token, expires_at into id, token, expires_at;

  return next;
end;
$$;

-- 4) RPC: signed-in user accepts an invite
create or replace function public.accept_invite(p_token text)
returns table(contractor_id uuid, role text)
language plpgsql
security definer
as $$
declare
  v_inv public.invites%rowtype;
  v_user uuid := auth.uid();
  v_exists boolean;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_inv
  from public.invites
  where token = p_token
  for update; -- lock row for atomic consume

  if not found then
    raise exception 'invalid_token';
  end if;

  if v_inv.expires_at < now() then
    raise exception 'expired';
  end if;

  if v_inv.uses >= v_inv.max_uses then
    raise exception 'already_used';
  end if;

  if v_inv.invited_email is not null then
    perform 1
    from auth.users u
    where u.id = v_user
      and lower(coalesce(u.email,'')) = lower(v_inv.invited_email);
    if not found then
      raise exception 'email_mismatch';
    end if;
  end if;

  -- attach membership if missing
  select exists(
    select 1 from public.memberships m
    where m.user_id = v_user
      and m.contractor_id = v_inv.contractor_id
  ) into v_exists;

  if not v_exists then
    insert into public.memberships (user_id, contractor_id, role, status)
    values (v_user, v_inv.contractor_id, coalesce(v_inv.role,'user'), 'active');
  end if;

  -- consume one use
  update public.invites
     set uses = uses + 1,
         consumed_by = v_user,
         consumed_at = now()
   where id = v_inv.id;

  contractor_id := v_inv.contractor_id;
  role := coalesce(v_inv.role,'user');
  return next;
end;
$$;

-- 5) RLS for invites (admin-only visibility & changes)
alter table public.invites enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='invites' and policyname='invites_select_admins_only'
  ) then
    create policy invites_select_admins_only
      on public.invites for select
      using (public.is_contractor_admin(contractor_id));
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='invites' and policyname='invites_insert_admins_only'
  ) then
    create policy invites_insert_admins_only
      on public.invites for insert
      with check (public.is_contractor_admin(contractor_id));
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='invites' and policyname='invites_update_admins_only'
  ) then
    create policy invites_update_admins_only
      on public.invites for update
      using (public.is_contractor_admin(contractor_id))
      with check (public.is_contractor_admin(contractor_id));
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname='public' and tablename='invites' and policyname='invites_delete_admins_only'
  ) then
    create policy invites_delete_admins_only
      on public.invites for delete
      using (public.is_contractor_admin(contractor_id));
  end if;
end$$;

-- Guard helper (optional)
create or replace function public.invite_is_valid(p_token text)
returns boolean language sql stable as
$$
  select exists(
    select 1 from public.invites i
    where i.token = p_token
      and i.expires_at > now()
      and i.uses < i.max_uses
  );
$$;

-- 6) Membership helpers for frontend guards
create or replace view public.current_memberships as
select m.*
from public.memberships m
where m.user_id = auth.uid();

create or replace function public.has_any_membership()
returns boolean language sql stable as
$$ select exists(select 1 from public.memberships m where m.user_id = auth.uid()); $$;

create or replace function public.has_membership(p_contractor_id uuid)
returns boolean language sql stable as
$$
  select exists(
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.contractor_id = p_contractor_id
  );
$$;
