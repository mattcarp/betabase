# Supabase Full Data Audit - 2025-11-24

## 🔌 Connected Database
**Project Name**: `mc-tk`
**Reference ID**: `kfxetwuuzljhybfgmpuc`
**Region**: East US (North Virginia)
**Status**: ✅ Connected via `.env.local`

## 📊 Total Record Count: 58,260

## 🏆 Top Tables by Volume

| Table Name | Record Count | Description |
| :--- | :--- | :--- |
| **`jira_ticket_embeddings`** | **16,563** | Vector embeddings for Jira tickets |
| **`siam_vectors`** | **15,245** | Unified knowledge base (AOMA) |
| **`jira_tickets`** | **10,927** | Raw Jira ticket data |
| **`beta_base_scenarios`** | **6,250** | Test scenarios? |
| **`git_file_embeddings`** | **4,091** | Vector embeddings for code files |
| **`code_files`** | **3,182** | Raw source code files |
| `crawled_pages` | 916 | Web crawler results |
| `wiki_documents` | 396 | Wiki documentation |
| `duplicate_files` | 113 | - |
| `git_commits` | 99 | Git history |
| `crawler_logs` | 97 | - |
| `todos` | 65 | - |

## ⚠️ Key Findings & Discrepancies

### 1. The "Missing" Data is in Separate Tables
You mentioned ~50,000 records. We found **58,260** total records.
The data is **fragmented** across multiple tables rather than being all in `siam_vectors`.

- **Jira Data**: 10,927 tickets + 16,563 embeddings are in `jira_*` tables. Only ~900 are in `siam_vectors`.
- **Code Data**: 3,182 files + 4,091 embeddings are in `git_*` tables.
- **Scenarios**: 6,250 records in `beta_base_scenarios`.

### 2. RAG System Implication
If the Chat AI only queries `siam_vectors` (which has 15,245 records), it is **missing access to**:
- ~10,000 Jira tickets
- ~3,000 Code files
- ~6,000 Scenarios

**Recommendation**: The RAG system needs to either:
A. **Migrate** all data into `siam_vectors` (Unified approach), OR
B. **Query multiple tables** (`jira_ticket_embeddings`, `git_file_embeddings`) dynamically.

## 📋 Full Table List

| Table Name | Count |
| :--- | :--- |
| accessibility | 0 |
| Account | 0 |
| accounts | 0 |
| aoma_console_logs | 0 |
| aoma_css_styles | 0 |
| aoma_dom_structures | 0 |
| aoma_navigation_links | 0 |
| aoma_sessions | 0 |
| aoma_test_dependencies | 0 |
| aoma_ui_elements | 0 |
| app_console_logs | 0 |
| app_links | 0 |
| app_pages | 0 |
| app_performance_metrics | 0 |
| app_screenshots | 0 |
| aqm_analyses | 1 |
| aqm_api_usage | 0 |
| aqm_audio_files | 2 |
| aqm_audio_knowledge | 0 |
| aqm_comparisons | 0 |
| aqm_ml_models | 5 |
| aqm_performance_metrics | 0 |
| aqm_processing_jobs | 1 |
| beta_base_executions | 0 |
| beta_base_scenarios | 6,250 |
| code_files | 3,182 |
| console_logs | 2 |
| context_source_weights | 4 |
| context_weights | 1 |
| conversations | 1 |
| crawled_pages | 916 |
| crawler_documents | 21 |
| crawler_logs | 97 |
| curation_items | 2 |
| deduplication_scans | 34 |
| dom_snapshots | 2 |
| duplicate_files | 113 |
| embedding_migration_status | 0 |
| file_metadata | 12 |
| firecrawl_analysis | 0 |
| generated_tests | 0 |
| git_commits | 99 |
| git_file_embeddings | 4,091 |
| jira_ticket_embeddings | 16,563 |
| jira_tickets | 10,927 |
| links | 0 |
| logs | 0 |
| messages | 21 |
| navigation_links | 0 |
| network_requests | 0 |
| page_states | 0 |
| pages | 7 |
| performance_metrics | 3 |
| Session | 7 |
| sessions | 0 |
| siam_git_files | 3 |
| siam_jira_tickets | 2 |
| siam_meeting_transcriptions | 0 |
| siam_vectors | 15,245 |
| siam_web_crawl_results | 0 |
| sync_status | 1 |
| system_metrics_snapshots | 1 |
| test_context_attribution | 0 |
| test_contexts | 0 |
| test_coverage | 0 |
| test_executions | 0 |
| test_feedback | 5 |
| test_generation_patterns | 8 |
| test_knowledge_base | 0 |
| test_quality_dimensions | 5 |
| test_results | 15 |
| test_runs | 2 |
| test_save_events | 0 |
| test_specs | 5 |
| todos | 65 |
| traces | 0 |
| User | 1 |
| user_nicknames | 0 |
| users | 0 |
| vector_query_performance | 0 |
| verification_tokens | 0 |
| VerificationToken | 14 |
| visual_baselines | 0 |
| visual_diffs | 0 |
| visual_snapshots | 0 |
| voice_settings | 0 |
| wiki_documents | 396 |
