## Git Repository Indexing Overview

This system indexes local frontend and backend Git repositories, extracts code structure and documentation, and enables semantic search across the codebase using Supabase vectors and OpenAI embeddings.

### Repository Configuration

- Frontend repository: set `GIT_FRONTEND_REPO_PATH`
- Backend repository: set `GIT_BACKEND_REPO_PATH`
- Additional repositories: set `GIT_ADDITIONAL_REPOS` (comma-separated)
- File filtering: configure `GIT_FILE_EXTENSIONS`, `GIT_EXCLUDE_PATTERNS`, `GIT_MAX_FILE_SIZE`, `GIT_INCLUDE_README`

### Content Extraction Capabilities

#### Code Structure Analysis

- TypeScript/JavaScript: extract imports/exports, functions, classes
- React Components: classification via file path heuristics (components/pages/hooks)
- API Endpoints: discover via file locations and exports
- Module Dependencies: import map extraction

#### Documentation Processing

- README files prioritized when `GIT_INCLUDE_README=true`
- Markdown parsing at a basic level (section text preserved in chunks)

#### Configuration & Metadata

- Package and config files included via extensions list
- Rich metadata: repository tag, file path, language, classification, imports/exports, functions/classes, chunk index, summary

### Indexing Process

1. Repository discovery from env via `MultiRepoIndexer`
2. File scanning and filtering via `gitIndexingHelpers`
3. Per-file analysis via `CodeStructureAnalyzer`
4. Chunking and vector preparation
5. Embedding generation and storage via `SupabaseVectorService`

### Search and Retrieval

- Semantic search via existing RPC `match_aoma_vectors`
- Filter by `source_type='git'` for code and README content

### Integration with SIAM Ecosystem

- MCP-compatible via unified vector store
- Endpoint: `POST /api/git-repo-index` to start indexing

### Maintenance

- Re-run `scripts/index-local-git-repos.sh` after changes
- Use `scripts/validate-git-indexing.sh` for quick checks
