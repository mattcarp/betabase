-- Multi-tenant vendor-agnostic content store for crawled docs and embeddings
-- Tables: documents, document_chunks, crawl_jobs, document_links

create extension if not exists vector;

-- documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  aut_id uuid,
  url text not null,
  canonical_url text,
  title text,
  lang text,
  content_md text,
  content_html text,
  content_hash text,
  metadata jsonb default '{}',
  crawled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')),'A') ||
    setweight(to_tsvector('english', coalesce(content_md,'')),'B')
  ) stored,
  constraint documents_tenant_url_uniq unique(tenant_id, url)
);

-- document_chunks
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  aut_id uuid,
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  chunk_md text,
  chunk_html text,
  embedding vector(1536),
  tokens int,
  created_at timestamptz default now(),
  constraint chunks_doc_unique unique(document_id, chunk_index)
);

-- crawl_jobs
create table if not exists crawl_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  aut_id uuid,
  root_url text not null,
  adapter text default 'firecrawl',
  status text default 'queued',
  stats jsonb default '{}',
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

-- document_links
create table if not exists document_links (
  tenant_id uuid not null,
  aut_id uuid,
  src_document_id uuid not null references documents(id) on delete cascade,
  dst_document_id uuid not null references documents(id) on delete cascade,
  relation text default 'link',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  primary key (tenant_id, src_document_id, dst_document_id, relation)
);

-- indexes
create index if not exists idx_documents_tenant_updated on documents(tenant_id, updated_at desc);
create index if not exists idx_documents_tsv on documents using gin(tsv);
create index if not exists idx_chunks_embedding_ivf on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_chunks_tenant_doc on document_chunks(tenant_id, document_id);
create index if not exists idx_links_tenant_src on document_links(tenant_id, src_document_id);

-- simple jwt tenant helper
create or replace function jwt_tenant_id() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'tenant_id'::uuid
$$;

-- RLS
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table crawl_jobs enable row level security;
alter table document_links enable row level security;

do $$ begin
  create policy doc_sel on documents for select using (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy doc_ins on documents for insert with check (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy doc_upd on documents for update using (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy doc_del on documents for delete using (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;

-- mirror basic policies for other tables
do $$ begin
  create policy chunk_sel on document_chunks for select using (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy chunk_ins on document_chunks for insert with check (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy chunk_upd on document_chunks for update using (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy chunk_del on document_chunks for delete using (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy jobs_sel on crawl_jobs for select using (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy jobs_ins on crawl_jobs for insert with check (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy links_sel on document_links for select using (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy links_ins on document_links for insert with check (tenant_id::text = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'));
exception when duplicate_object then null; end $$;


