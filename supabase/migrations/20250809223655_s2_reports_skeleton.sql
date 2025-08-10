-- Sprint 2: Reports MVP (no RLS yet)

create type public.report_status as enum ('draft','submitted','signed','archived');
create type public.final_source as enum ('user','ai','mixed');

create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  contractor_id   uuid not null references public.contractors(id) on delete cascade,
  title           text not null default 'Untitled Report',
  status          public.report_status not null default 'draft',
  company_name    text,
  equipment_name  text,
  equipment_model text,
  equipment_serial text,
  inspector_user_id uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_reports_contractor on public.reports (contractor_id);
create index if not exists idx_reports_status on public.reports (status);

create table if not exists public.report_sections (
  id            uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  report_id     uuid not null references public.reports(id) on delete cascade,
  section_key   text not null, -- e.g., opening/components/closing/custom:xyz
  order_index   int not null default 0,
  text_user     text,
  text_ai       text,
  text_final    text,
  final_source  public.final_source not null default 'user',
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists idx_sections_report on public.report_sections (report_id);
create index if not exists idx_sections_contractor on public.report_sections (contractor_id);

create table if not exists public.report_media (
  id            uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  report_id     uuid not null references public.reports(id) on delete cascade,
  kind          text not null check (kind in ('photo','pdf','thumbnail')),
  storage_path  text not null,
  mime_type     text,
  caption       text,
  sort_index    int not null default 0,
  taken_at      timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_media_report on public.report_media (report_id);
create index if not exists idx_media_contractor on public.report_media (contractor_id);
