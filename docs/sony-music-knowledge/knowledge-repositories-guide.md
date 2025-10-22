## Sony Music Knowledge Ecosystem Overview

This guide documents the Sony Music knowledge repository ecosystem and how SIAM integrates with it for demos.

### Knowledge Repository URLs

- **JIRA**: `https://jira.smedigitalapps.com/jira`
- **Wiki/Confluence**: `https://wiki.smedigitalapps.com/wiki/display/AOMA/AOMA+Release+Notes`
- **AOMA Staging**: `https://aoma-stage.smcdp-de.net`
- **Alexandria**: Investigation needed

### JIRA Projects

- AOMA, USM, TECH, API

### Confluence Spaces

- AOMA, USM, TECH, API, RELEASE

### Authentication and Environment Variables

- JIRA: `JIRA_BASE_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN`
- Confluence: `CONFLUENCE_BASE_URL`, `CONFLUENCE_USERNAME`, `CONFLUENCE_API_TOKEN`, `CONFLUENCE_SPACES`
- AOMA Stage: `AOMA_STAGE_URL`

### Crawling & Storage Pipeline

1. Firecrawl v2 authenticates against each source
2. Content ingested and embedded with OpenAI
3. Stored in Supabase `aoma_unified_vectors` with `source_type` of `jira` or `confluence`

### Usage

- Crawl JIRA: `POST /api/sony-music-jira-crawl` with `{ "projects": ["AOMA","USM","TECH","API"] }`
- Crawl Confluence: `POST /api/confluence-crawl` with `{ "spaces": ["AOMA","USM","TECH","API","RELEASE"] }`

### Demo Preparation

- Prioritize AOMA and USM content
- Validate relevance via semantic search
- Ensure tokens and VPN access are configured
