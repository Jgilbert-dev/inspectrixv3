-- Invite-only Registration: enforcement + RPCs
-- This migration assumes you already have public.invites from s1_tenant_skeleton.
-- It adds any missing columns we need, creates an auth.users trigger to block
-- non-invited signups, and provides an accept_invite(token) RPC to attach the user.

-----------------------------
-- Ensure invites has columns
-----------------------------
alter table public.invites
  add column if not exists email           text,
  add column if not exists token           uuid default gen_random_uuid(),
  add column if not exists contractor_id   uuid references public.contractors(id) on delete cascade,
  add column if not exists role            text default 'inspector',
  add column if not exists expires_at      timestamptz,
  add column if not exists used_at         timestamptz,
  add column if not exists used_by         uuid references auth.users(id) on delete set null;

create unique index if not exists invites_token_key on public.invites(token);
create index if not exists idx_invites_email on public.invites (lower(email));
create index if not exists idx_invites_contractor on public.invites (contractor_id);

----------------------------------------------
-- Helper: normalize emails and time validity
----------------------------------------------
create or replace function public._invite_is_valid(p_email text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.invites i
    where lower(i.email) = lower(p_email)
      and i.used_at is null
      and (i.expires_at is null or i.expires_at > now())
  )
$$;

---------------------------------------------------------
-- TRIGGER: require a valid invite before creating a user
-- This blocks supabase.auth.signUp if no invite exists.
---------------------------------------------------------
create or replace function public.require_invite_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  ok boolean;
begin
  -- Require a valid (unused, unexpired) invite for the email
  select public._invite_is_valid(new.email) into ok;
  if not ok then
    raise exception 'Signup blocked: invite required for %', new.email
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_require_invite_on_auth_users on auth.users;
create trigger trg_require_invite_on_auth_users
before insert on auth.users
for each row
execute function public.require_invite_on_signup();

-----------------------------------------------------
-- RPC: accept_invite(token) -> attaches membership
-- Call this immediately after sign-up + session set.
-----------------------------------------------------
create or replace function public.accept_invite(p_token uuid)
returns table (contractor_id uuid, role text)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_email   text;
  v_invite  public.invites%rowtype;
begin
  if v_user_id is null then
    raise exception 'Must be authenticated to accept invite';
  end if;

  -- Fetch auth email from JWT (auth.jwt() claim) or auth.users
  -- Prefer JWT email to avoid race conditions.
  begin
    v_email := (select (auth.jwt() ->> 'email'));
  exception when others then
    v_email := null;
  end;

  if v_email is null then
    select email into v_email from auth.users where id = v_user_id;
  end if;

  -- Find the invite by token AND email (case-insensitive), valid and unused
  select *
  into v_invite
  from public.invites i
  where i.token = p_token
    and lower(i.email) = lower(v_email)
    and i.used_at is null
    and (i.expires_at is null or i.expires_at > now())
  limit 1;

  if not found then
    raise exception 'Invite not found or already used/expired';
  end if;

  -- Create membership (owner/admin/inspector from invite.role)
  insert into public.memberships (contractor_id, user_id, role, status)
  values (v_invite.contractor_id, v_user_id, coalesce(v_invite.role, 'inspector'), 'active')
  on conflict do nothing;

  -- Mark invite used
  update public.invites
  set used_at = now(),
      used_by = v_user_id
  where id = v_invite.id;

  -- Return useful info
  return query
  select v_invite.contractor_id, v_invite.role;
end;
$$;

grant execute on function public.accept_invite(uuid) to authenticated;

------------------------------------------------------------
-- Dev helper: create_invite(contractor_id, email, role, ttl)
------------------------------------------------------------
create or replace function public.create_invite(
  p_contractor_id uuid,
  p_email         text,
  p_role          text default 'inspector',
  p_ttl           interval default '7 days'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_token uuid := gen_random_uuid();
begin
  insert into public.invites (contractor_id, email, role, token, expires_at)
  values (p_contractor_id, p_email, p_role, v_token, now() + p_ttl);
  return v_token;
end;
$$;

-- Limit who can generate invites (adjust as needed):
-- For local dev, let authenticated create invites for their own contractor.
grant execute on function public.create_invite(uuid, text, text, interval) to authenticated;

-- Policy to allow creating invites for your own contractor (optional-hardening for prod)
-- You can remove these if you plan to create invites only via service role or Studio.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='invites' and policyname='invites_ins_own_contractor') then
    create policy "invites_ins_own_contractor"
    on public.invites
    for insert
    to authenticated
    with check (
      exists (
        select 1 from public.memberships m
        where m.user_id = auth.uid()
          and m.status = 'active'
          and m.contractor_id = public.invites.contractor_id
          and m.role in ('owner','admin')
      )
    );
  end if;
end$$;
