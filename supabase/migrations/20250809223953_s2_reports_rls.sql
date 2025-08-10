-- Sprint 2: RLS for reports, report_sections, report_media

alter table public.reports         enable row level security;
alter table public.report_sections enable row level security;
alter table public.report_media    enable row level security;

-- reports
create policy "reports_select_same_contractor"
on public.reports
for select
using (
  exists (
    select 1 from public.memberships m
    where m.contractor_id = reports.contractor_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

create policy "reports_modify_same_contractor"
on public.reports
for all
to authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.contractor_id = reports.contractor_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
)
with check (
  exists (
    select 1 from public.memberships m
    where m.contractor_id = reports.contractor_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

-- report_sections
create policy "sections_select_same_contractor"
on public.report_sections
for select
using (
  exists (
    select 1 from public.memberships m
    where m.contractor_id = report_sections.contractor_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

create policy "sections_modify_same_contractor"
on public.report_sections
for all
to authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.contractor_id = report_sections.contractor_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
)
with check (
  exists (
    select 1 from public.memberships m
    where m.contractor_id = report_sections.contractor_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

-- report_media
create policy "media_select_same_contractor"
on public.report_media
for select
using (
  exists (
    select 1 from public.memberships m
    where m.contractor_id = report_media.contractor_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);

create policy "media_modify_same_contractor"
on public.report_media
for all
to authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.contractor_id = report_media.contractor_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
)
with check (
  exists (
    select 1 from public.memberships m
    where m.contractor_id = report_media.contractor_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
);
