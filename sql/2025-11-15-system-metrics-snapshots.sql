-- System metrics snapshots for performance dashboard
create table if not exists public.system_metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  metrics jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists system_metrics_snapshots_created_at_idx
  on public.system_metrics_snapshots (created_at desc);

