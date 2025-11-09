-- Beta Base Historical Test Scenarios
-- Stores AOMA scenarios imported from Beta Base with optimized querying

create extension if not exists vector;
create extension if not exists pg_trgm; -- For fuzzy text search

-- ==================================================
-- BETA BASE SCENARIOS TABLE
-- ==================================================

create table if not exists beta_base_scenarios (
  -- Primary identifiers
  id uuid primary key default gen_random_uuid(),
  beta_base_id int not null unique, -- Original Beta Base scenario.id

  -- Core scenario content
  name text not null,
  script_text text,
  expected_result_text text,
  preconditions_text text,

  -- Metadata
  created_at timestamptz not null,
  created_by text,
  updated_at timestamptz,
  updated_by text,
  tags text[] default '{}',

  -- Relevance & Classification
  relevance_score int not null check (relevance_score >= 0 and relevance_score <= 100),
  tier text not null check (tier in ('GOLD', 'SILVER', 'BRONZE', 'TRASH')),

  -- Execution history aggregates (denormalized for fast queries)
  execution_count int not null default 0,
  pass_rate numeric(5,4) check (pass_rate >= 0 and pass_rate <= 1), -- 0.0000 to 1.0000
  last_execution_date timestamptz,

  -- Vector embedding for similarity search
  embedding vector(1536), -- OpenAI ada-002 or similar

  -- Original HTML content (preserved for reference)
  metadata jsonb not null default '{}'::jsonb,
  -- Structure: {
  --   "original_html_script": "...",
  --   "original_html_expected": "...",
  --   "original_html_preconditions": "...",
  --   "is_security": false,
  --   "review_flag": false,
  --   "flag_reason": null,
  --   "coverage": "Regression",
  --   "client_priority": null
  -- }

  -- Search optimization
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(script_text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(expected_result_text, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(preconditions_text, '')), 'D')
  ) stored,

  -- Timestamps
  imported_at timestamptz not null default now()
);

-- ==================================================
-- BETA BASE TEST EXECUTIONS TABLE
-- ==================================================

create table if not exists beta_base_executions (
  id uuid primary key default gen_random_uuid(),
  beta_base_id int not null, -- Original Beta Base test.id
  scenario_id uuid not null references beta_base_scenarios(id) on delete cascade,

  -- Execution details
  executed_at timestamptz not null,
  executed_by text,
  pass_fail text not null check (pass_fail in ('Pass', 'Fail', 'Pending')),

  -- Results
  input_text text,
  result_text text,
  comments text,

  -- Environment
  build text,
  ticket text, -- Jira ticket reference
  browser_name text,
  os_name text,

  -- Timestamps
  imported_at timestamptz not null default now(),

  constraint executions_beta_base_id_unique unique(beta_base_id)
);

-- ==================================================
-- INDEXES FOR OPTIMIZED QUERIES
-- ==================================================

-- Primary lookup indexes
create index idx_scenarios_beta_base_id on beta_base_scenarios(beta_base_id);
create index idx_scenarios_tier on beta_base_scenarios(tier);
create index idx_scenarios_relevance on beta_base_scenarios(relevance_score desc);
create index idx_scenarios_created on beta_base_scenarios(created_at desc);

-- Search indexes
create index idx_scenarios_search on beta_base_scenarios using gin(search_vector);
create index idx_scenarios_name_trgm on beta_base_scenarios using gin(name gin_trgm_ops);
create index idx_scenarios_tags on beta_base_scenarios using gin(tags);

-- Vector similarity search (HNSW for fast approximate search)
create index idx_scenarios_embedding_hnsw on beta_base_scenarios
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Execution history indexes
create index idx_executions_scenario on beta_base_executions(scenario_id);
create index idx_executions_executed on beta_base_executions(executed_at desc);
create index idx_executions_pass_fail on beta_base_executions(pass_fail);
create index idx_executions_ticket on beta_base_executions(ticket) where ticket is not null;

-- Composite index for common queries (tier + relevance)
create index idx_scenarios_tier_relevance on beta_base_scenarios(tier, relevance_score desc);

-- ==================================================
-- MATERIALIZED VIEW FOR COMMON QUERY PATTERNS
-- ==================================================
-- Simplified version - will be populated after data import

create materialized view beta_base_query_patterns as
select
  '' as pattern,
  0::bigint as frequency,
  0.0::numeric as avg_relevance,
  0.0::numeric as avg_pass_rate,
  array[]::text[] as tiers,
  array[]::uuid[] as top_scenario_ids
where false; -- Empty initially, will refresh after import

create index idx_query_patterns_pattern on beta_base_query_patterns(pattern);

-- ==================================================
-- FUNCTIONS FOR SMART QUERIES
-- ==================================================

-- Find similar scenarios using vector search
create or replace function find_similar_scenarios(
  query_embedding vector(1536),
  match_threshold float default 0.8,
  match_count int default 10,
  min_tier text default 'BRONZE'
)
returns table (
  id uuid,
  name text,
  tier text,
  relevance_score int,
  similarity float,
  execution_count int,
  pass_rate numeric
)
language sql stable
as $$
  select
    s.id,
    s.name,
    s.tier,
    s.relevance_score,
    1 - (s.embedding <=> query_embedding) as similarity,
    s.execution_count,
    s.pass_rate
  from beta_base_scenarios s
  where
    s.embedding is not null
    and 1 - (s.embedding <=> query_embedding) > match_threshold
    and case min_tier
      when 'GOLD' then s.tier = 'GOLD'
      when 'SILVER' then s.tier in ('GOLD', 'SILVER')
      when 'BRONZE' then s.tier in ('GOLD', 'SILVER', 'BRONZE')
      else true
    end
  order by s.embedding <=> query_embedding
  limit match_count;
$$;

-- Search scenarios by text with ranking
create or replace function search_scenarios(
  search_query text,
  min_tier text default 'BRONZE',
  result_limit int default 20
)
returns table (
  id uuid,
  name text,
  tier text,
  relevance_score int,
  rank float,
  execution_count int,
  pass_rate numeric,
  snippet text
)
language sql stable
as $$
  select
    s.id,
    s.name,
    s.tier,
    s.relevance_score,
    ts_rank(s.search_vector, websearch_to_tsquery('english', search_query)) as rank,
    s.execution_count,
    s.pass_rate,
    ts_headline('english',
      coalesce(s.script_text, s.expected_result_text, s.name),
      websearch_to_tsquery('english', search_query),
      'MaxWords=30, MinWords=10'
    ) as snippet
  from beta_base_scenarios s
  where
    s.search_vector @@ websearch_to_tsquery('english', search_query)
    and case min_tier
      when 'GOLD' then s.tier = 'GOLD'
      when 'SILVER' then s.tier in ('GOLD', 'SILVER')
      when 'BRONZE' then s.tier in ('GOLD', 'SILVER', 'BRONZE')
      else true
    end
  order by rank desc, s.relevance_score desc
  limit result_limit;
$$;

-- Get execution trend for a scenario
create or replace function get_execution_trend(scenario_uuid uuid)
returns table (
  month text,
  total_executions bigint,
  pass_count bigint,
  fail_count bigint,
  pass_rate numeric
)
language sql stable
as $$
  select
    to_char(executed_at, 'YYYY-MM') as month,
    count(*) as total_executions,
    count(*) filter (where pass_fail = 'Pass') as pass_count,
    count(*) filter (where pass_fail = 'Fail') as fail_count,
    round(
      count(*) filter (where pass_fail = 'Pass')::numeric / nullif(count(*), 0),
      4
    ) as pass_rate
  from beta_base_executions
  where scenario_id = scenario_uuid
  group by to_char(executed_at, 'YYYY-MM')
  order by month desc;
$$;

-- ==================================================
-- ROW LEVEL SECURITY (Public Read-Only for Now)
-- ==================================================

alter table beta_base_scenarios enable row level security;
alter table beta_base_executions enable row level security;

-- Allow authenticated users to read scenarios
create policy scenarios_read on beta_base_scenarios
  for select
  using (true); -- Public read for now, can restrict by tenant later

-- Allow authenticated users to read executions
create policy executions_read on beta_base_executions
  for select
  using (true);

-- Only admins can insert (via import script with service role)
-- No update/delete policies for regular users

-- ==================================================
-- REFRESH FUNCTION FOR MATERIALIZED VIEW
-- ==================================================

create or replace function refresh_query_patterns()
returns void
language plpgsql
as $$
begin
  refresh materialized view concurrently beta_base_query_patterns;
end;
$$;

-- ==================================================
-- COMMENTS FOR DOCUMENTATION
-- ==================================================

comment on table beta_base_scenarios is
  'Historical AOMA test scenarios imported from Beta Base (2008-2022). Used for RLHF context and regression detection.';

comment on column beta_base_scenarios.relevance_score is
  'Computed score (0-100) based on age, execution frequency, pass rate, and content quality.';

comment on column beta_base_scenarios.tier is
  'Classification: GOLD (recent, high-quality), SILVER (needs updating), BRONZE (historical reference), TRASH (obsolete).';

comment on column beta_base_scenarios.embedding is
  'Vector embedding for semantic similarity search. Generated from name + script + expected result.';

comment on function find_similar_scenarios is
  'Find scenarios semantically similar to a query embedding using vector cosine similarity.';

comment on function search_scenarios is
  'Full-text search across scenarios with ranking and snippet extraction.';
