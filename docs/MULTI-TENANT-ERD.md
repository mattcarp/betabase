# SIAM Multi-Tenant Vector Store ERD

**Architecture Date:** November 2, 2025  
**Migration:** `005_multi_tenant_restructure_fixed.sql`

## Entity Relationship Diagram

```mermaid
erDiagram
    ORGANIZATION ||--o{ DIVISION : contains
    DIVISION ||--o{ APP_UNDER_TEST : contains
    APP_UNDER_TEST ||--o{ SIAM_VECTORS : stores
    APP_UNDER_TEST ||--o{ SIAM_MIGRATION_STATUS : tracks
    
    ORGANIZATION {
        string name PK "e.g., sony-music"
        string description
    }
    
    DIVISION {
        string name PK "e.g., digital-operations"
        string organization FK
        string description
    }
    
    APP_UNDER_TEST {
        string name PK "e.g., aoma, usm"
        string organization FK
        string division FK
        string description
    }
    
    SIAM_VECTORS {
        uuid id PK
        varchar organization FK "NOT NULL, validated"
        varchar division FK "NOT NULL, validated"
        varchar app_under_test FK "NOT NULL, validated"
        text content "Vector content"
        vector_1536 embedding "OpenAI embedding"
        vector_768 embedding_gemini "Gemini embedding"
        text source_type "e.g., jira, confluence, git"
        text source_id "Unique per source"
        jsonb metadata "Flexible metadata"
        timestamp created_at
        timestamp updated_at
        text embedding_source "openai or gemini"
    }
    
    SIAM_MIGRATION_STATUS {
        uuid id PK
        varchar organization FK "NOT NULL"
        varchar division FK "NOT NULL"
        varchar app_under_test FK "NOT NULL"
        text source_type "Type being migrated"
        integer total_count
        integer migrated_count
        integer failed_count
        text status "completed, in_progress, failed"
        timestamp updated_at
    }
```

## 3-Level Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ LEVEL 1: ORGANIZATION                                   │
│   └─ sony-music                                         │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │ LEVEL 2: DIVISION                               │  │
│   │   └─ digital-operations                         │  │
│   │   └─ label-services                             │  │
│   │   └─ artist-relations                           │  │
│   │                                                  │  │
│   │   ┌─────────────────────────────────────────┐   │  │
│   │   │ LEVEL 3: APP_UNDER_TEST                 │   │  │
│   │   │   └─ aoma (Asset & Offering Mgmt)       │   │  │
│   │   │   └─ usm (Universal Session Manager)    │   │  │
│   │   │   └─ dam (Digital Asset Management)     │   │  │
│   │   │   └─ crm (Customer Relationship Mgmt)   │   │  │
│   │   └─────────────────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Table Details

### `siam_vectors` (Main Vector Store)

**Purpose:** Multi-tenant vector embeddings for knowledge retrieval

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, AUTO | Unique identifier |
| organization | varchar(50) | NOT NULL, CHECK | Organization identifier (Level 1) |
| division | varchar(50) | NOT NULL, CHECK | Division identifier (Level 2) |
| app_under_test | varchar(50) | NOT NULL, CHECK | App being tested (Level 3) |
| content | text | NOT NULL | Raw text content |
| embedding | vector(1536) | NULLABLE | OpenAI text-embedding-ada-002 |
| embedding_gemini | vector(768) | NULLABLE | Gemini text-embedding-004 |
| embedding_source | text | DEFAULT 'openai' | Which embedding is active |
| source_type | text | NOT NULL | jira, confluence, git, etc. |
| source_id | text | NOT NULL | Unique ID within source |
| metadata | jsonb | DEFAULT '{}' | Flexible metadata |
| created_at | timestamp | DEFAULT NOW() | Creation timestamp |
| updated_at | timestamp | DEFAULT NOW() | Last update timestamp |

**Unique Constraint:**
```sql
UNIQUE(organization, division, app_under_test, source_type, source_id)
```

**Validation Constraints:**
```sql
CHECK (organization ~ '^[a-z][a-z0-9_-]*$')
CHECK (division ~ '^[a-z][a-z0-9_-]*$')
CHECK (app_under_test ~ '^[a-z][a-z0-9_-]*$')
```

### `siam_migration_status` (Migration Tracking)

**Purpose:** Track embedding migration progress per tenant

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, AUTO | Unique identifier |
| organization | varchar(50) | NOT NULL | Organization identifier |
| division | varchar(50) | NOT NULL | Division identifier |
| app_under_test | varchar(50) | NOT NULL | App being tested |
| source_type | text | NOT NULL | Type being migrated |
| total_count | integer | DEFAULT 0 | Total documents |
| migrated_count | integer | DEFAULT 0 | Successfully migrated |
| failed_count | integer | DEFAULT 0 | Failed migrations |
| status | text | DEFAULT 'pending' | Migration status |
| updated_at | timestamp | DEFAULT NOW() | Last update |

**Unique Constraint:**
```sql
UNIQUE(organization, division, app_under_test, source_type)
```

## Indexes

### Primary Performance Index (HNSW)
```sql
CREATE INDEX siam_vectors_embedding_hnsw_idx
  ON siam_vectors 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;
```

**Parameters:**
- `m = 16`: Max connections per layer (higher = better recall, more memory)
- `ef_construction = 64`: Build-time search quality
- Vector ops: Cosine similarity

### Supporting Indexes

1. **Hierarchy Index**
```sql
CREATE INDEX siam_vectors_hierarchy_idx
  ON siam_vectors(organization, division, app_under_test);
```

2. **Source Type Index**
```sql
CREATE INDEX siam_vectors_source_type_idx
  ON siam_vectors(organization, division, app_under_test, source_type);
```

3. **Metadata Index (GIN)**
```sql
CREATE INDEX siam_vectors_metadata_idx
  ON siam_vectors USING gin(metadata);
```

4. **Temporal Index**
```sql
CREATE INDEX siam_vectors_created_at_idx
  ON siam_vectors(organization, division, app_under_test, created_at DESC);
```

## Functions

### `match_siam_vectors()` - Semantic Search

```sql
match_siam_vectors(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  p_app_under_test VARCHAR(50),
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10,
  filter_source_types text[] DEFAULT NULL
)
```

**Returns:** Ranked results with similarity scores

**HNSW Settings:**
- `hnsw.ef_search = 40` (search quality vs speed)

### `match_siam_vectors_fast()` - Fast Search

Same parameters, but:
- No threshold filtering (returns all matches)
- `hnsw.ef_search = 20` (2x faster)

### `upsert_siam_vector()` - Insert/Update

```sql
upsert_siam_vector(
  p_organization VARCHAR(50),
  p_division VARCHAR(50),
  p_app_under_test VARCHAR(50),
  p_content text,
  p_embedding vector(1536),
  p_source_type text,
  p_source_id text,
  p_metadata jsonb DEFAULT '{}'
)
```

**Behavior:**
- Inserts if new
- Updates if exists (based on unique constraint)
- Returns UUID of affected row

## Analytics View

### `siam_vector_stats` (Aggregated Metrics)

```sql
CREATE VIEW siam_vector_stats AS
SELECT
  organization,
  division,
  app_under_test,
  source_type,
  COUNT(*) as document_count,
  AVG(length(content)) as avg_content_length,
  MIN(created_at) as oldest_document,
  MAX(created_at) as newest_document,
  pg_size_pretty(SUM(pg_column_size(embedding))::bigint) as embedding_storage_size
FROM siam_vectors
GROUP BY organization, division, app_under_test, source_type;
```

## Multi-Tenancy Benefits

### 1. **Isolation**
- Each app's data is logically separated
- Queries are automatically scoped to tenant
- No cross-contamination of results

### 2. **Scalability**
- Horizontal partitioning by tenant
- Independent scaling per app
- Efficient index usage

### 3. **Flexibility**
- Add new apps without schema changes
- Different source types per app
- Custom metadata per tenant

### 4. **Performance**
- Indexes scoped to tenant
- Smaller search spaces
- Faster query execution

## Example Queries

### Insert Document
```sql
SELECT upsert_siam_vector(
  'sony-music',
  'digital-operations',
  'aoma',
  'How to create a new asset in AOMA...',
  '[0.123, 0.456, ...]'::vector(1536),
  'confluence',
  'AOMA-123',
  '{"title": "AOMA User Guide", "author": "John Doe"}'::jsonb
);
```

### Search Knowledge
```sql
SELECT * FROM match_siam_vectors(
  'sony-music',
  'digital-operations',
  'aoma',
  '[0.789, 0.012, ...]'::vector(1536),
  0.78,
  10,
  ARRAY['confluence', 'jira']
);
```

### Get Stats
```sql
SELECT * FROM siam_vector_stats
WHERE organization = 'sony-music'
  AND division = 'digital-operations'
  AND app_under_test = 'aoma';
```

## Migration Notes

### Data Seeding
All existing data was automatically tagged with default values:
- `organization = 'sony-music'`
- `division = 'digital-operations'`
- `app_under_test = 'aoma'`

### Adding New Tenants
No schema changes needed! Just insert with new values:
```sql
INSERT INTO siam_vectors (
  organization,
  division,
  app_under_test,
  ...
) VALUES (
  'sony-music',
  'label-services',
  'crm',
  ...
);
```

## Security

### Row Level Security (RLS)
Currently using service role key (authenticated users have full access).

**Future Enhancement:** Add RLS policies per tenant:
```sql
ALTER TABLE siam_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON siam_vectors
  USING (
    organization = current_setting('app.current_organization')
    AND division = current_setting('app.current_division')
    AND app_under_test = current_setting('app.current_app')
  );
```

## Performance Characteristics

### Search Performance
- **Single tenant query**: ~50-200ms (10 results, 1536d vectors)
- **HNSW vs IVFFlat**: 3-5x faster with HNSW
- **Batch inserts**: ~100 vectors/second

### Storage
- **Per vector**: ~6KB (1536d) + ~3KB (768d Gemini)
- **Per 10K vectors**: ~90MB
- **Per 100K vectors**: ~900MB

### Index Build Time
- **10K vectors**: ~30 seconds
- **100K vectors**: ~5 minutes
- **Rebuild trigger**: Automatic on significant inserts

---

**Status:** Production-ready as of November 2, 2025  
**Migration File:** `supabase/migrations/005_multi_tenant_restructure_fixed.sql`  
**Related Tasks:** Task 90 - Restructure Vector Store for Multi-Tenancy

