-- Sprint 1: Enable RLS + baseline policies

alter table public.contractors enable row level security;
alter table public.memberships enable row level security;
alter table public.invites     enable row level security;

-- Users can read contractors they belong to
create policy "contractors_select_my_tenant"
on public.contractors
for select
using (
  exists (
    select 1 from public.memberships m
    where m.contractor_id = contractors.id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

-- Users can read their own membership rows
create policy "memberships_select_self"
on public.memberships
for select
using (user_id = auth.uid());

-- No policies on invites yet (service_role only via GoTrue/Edge)
