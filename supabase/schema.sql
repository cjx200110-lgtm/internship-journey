create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  title text,
  content text not null,
  reflection_date date not null,
  image_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.reflections
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

create index if not exists reflections_reflection_date_idx
  on public.reflections (reflection_date desc, created_at desc);

create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  overview_lines jsonb not null,
  reflections jsonb not null,
  todo_items jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_reports_period_unique unique (period_start, period_end)
);

alter table public.monthly_reports
  add column if not exists status text not null default 'draft';

alter table public.monthly_reports
  add column if not exists published_at timestamptz;

alter table public.monthly_reports
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'monthly_reports_status_check'
  ) then
    alter table public.monthly_reports
      add constraint monthly_reports_status_check
      check (status in ('draft', 'published'));
  end if;
end $$;

create index if not exists monthly_reports_period_end_idx
  on public.monthly_reports (period_end desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reflection-images',
  'reflection-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
