-- s3_invites_hardened_patch.sql

-- 1) Table-level guardrails
alter table public.invites
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'invites_uses_bounds'
      and conrelid = 'public.invites'::regclass
  ) then
    alter table public.invites
      add constraint invites_uses_bounds
      check (uses >= 0 and uses <= max_uses);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'invites_max_uses_min'
      and conrelid = 'public.invites'::regclass
  ) then
    alter table public.invites
      add constraint invites_max_uses_min
      check (max_uses >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'invites_expires_after_created'
      and conrelid = 'public.invites'::regclass
  ) then
    alter table public.invites
      add constraint invites_expires_after_created
      check (expires_at > created_at);
  end if;
end$$;

-- 2) Tighten admin check (already OK, keep here for completeness)
create or replace function public.is_contractor_admin(p_contractor_id uuid)
returns boolean language sql stable as
$$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.contractor_id = p_contractor_id
      and m.status = 'active'
      and m.role in ('owner','admin')
  );
$$;

-- 3) Enforce create_invite inputs (TTL, max_uses, role)
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
  v_token text;
  v_exp timestamptz;
begin
  if not public.is_contractor_admin(p_contractor_id) then
    raise exception using message = 'not_admin';
  end if;

  if p_role is distinct from null and p_role not in ('admin','user') then
    raise exception using message = 'invalid_role';
  end if;

  if p_max_uses is null or p_max_uses < 1 then
    raise exception using message = 'invalid_max_uses';
  end if;

  if p_ttl_minutes is null or p_ttl_minutes < 60 or p_ttl_minutes > 1440 then
    raise exception using message = 'ttl_out_of_range';
  end if;

  v_token := encode(gen_random_bytes(16), 'hex');
  v_exp   := now() + make_interval(mins => p_ttl_minutes);

  insert into public.invites (contractor_id, token, invited_email, role, max_uses, expires_at, created_by, notes)
  values (p_contractor_id, v_token, p_invited_email, coalesce(p_role,'user'), p_max_uses, v_exp, auth.uid(), p_notes)
  returning id, token, expires_at into id, token, expires_at;

  return next;
end;
$$;

-- 4) Keep accept_invite atomic + stable errors
create or replace function public.accept_invite(p_token text)
returns table(contractor_id uuid, role text)
language plpgsql
security definer
as $$
declare
  v_inv public.invites%rowtype;
  v_user uuid := auth.uid();
  v_has boolean;
begin
  if v_user is null then
    raise exception using message = 'not_authenticated';
  end if;

  -- lock invite for atomic consumption
  select * into v_inv
  from public.invites
  where token = p_token
  for update;

  if not found then
    raise exception using message = 'invalid_token';
  end if;

  if v_inv.expires_at < now() then
    raise exception using message = 'expired';
  end if;

  if v_inv.uses >= v_inv.max_uses then
    raise exception using message = 'already_used';
  end if;

  if v_inv.invited_email is not null then
    perform 1
    from auth.users u
    where u.id = v_user
      and lower(coalesce(u.email,'')) = lower(v_inv.invited_email);
    if not found then
      raise exception using message = 'email_mismatch';
    end if;
  end if;

  select exists(
    select 1 from public.memberships m
    where m.user_id = v_user
      and m.contractor_id = v_inv.contractor_id
      and m.status = 'active'
  ) into v_has;

  if not v_has then
    insert into public.memberships (user_id, contractor_id, role, status)
    values (v_user, v_inv.contractor_id, coalesce(v_inv.role,'user'), 'active');
  end if;

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

-- 5) Membership view: active-only
create or replace view public.current_memberships as
select m.*
from public.memberships m
where m.user_id = auth.uid()
  and m.status = 'active';

-- 6) Helpers unchanged
create or replace function public.has_any_membership()
returns boolean language sql stable as
$$
  select exists(
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.has_membership(p_contractor_id uuid)
returns boolean language sql stable as
$$
  select exists(
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.contractor_id = p_contractor_id
      and m.status = 'active'
  );
$$;
