# Confluence API Setup Instructions

## Required Credentials

Add these to your `.env.local` file:

```bash
# Confluence REST API
CONFLUENCE_BASE_URL=https://wiki.smedigitalapps.com
CONFLUENCE_USERNAME=your.email@sonymusic.com
CONFLUENCE_API_TOKEN=your_api_token_here
```

## How to Get an API Token

### Option 1: Confluence Personal Access Token
1. Go to https://wiki.smedigitalapps.com
2. Click your profile picture → Settings
3. Look for "Personal Access Tokens" or "API Tokens"
4. Click "Create Token" or "Generate"
5. Give it a name (e.g., "SIAM Crawler")
6. Copy the token immediately (you won't see it again!)

### Option 2: Atlassian API Token (if using Atlassian Account)
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a label (e.g., "SIAM Confluence Crawler")
4. Copy the token

## Test Connection

Once credentials are added to `.env.local`, test the connection:

```bash
# From project root
cd /Users/mcarpent/Documents/projects/siam

# Source the env file
export $(cat .env.local | grep -v '^#' | xargs)

# Test auth
curl -u "$CONFLUENCE_USERNAME:$CONFLUENCE_API_TOKEN" \
  -H "Accept: application/json" \
  "$CONFLUENCE_BASE_URL/wiki/rest/api/space?limit=1"
```

You should see a JSON response with space information if authentication works.

## What the Crawler Does

The Confluence crawler (`src/services/confluenceCrawler.ts`) will:

1. **Authenticate** using Basic Auth (username + API token)
2. **List pages** from specified spaces (AOMA, USM, TECH, API, RELEASE)
3. **Fetch content** using REST API endpoint: `/wiki/rest/api/content`
4. **Convert HTML → Markdown** using `confluenceHelpers.ts`
5. **Generate embeddings** using OpenAI `text-embedding-3-small`
6. **Store in Supabase** `wiki_documents` table with:
   - Full markdown content
   - 1536-dimensional embedding vector
   - Metadata (space, labels, author, version, etc.)
   - Content hash for deduplication

## Target Page

Starting with your specified USM page:
- https://wiki.smedigitalapps.com/wiki/pages/viewpage.action?pageId=67863500
- Space: USM
- Title: "Client Application Developers Guide to USM"

The crawler will automatically:
- Fetch this page
- Follow links to related pages in the same space
- Respect the 200-page limit per space (configurable)

## Ready to Run

Once you add the credentials to `.env.local`, I can:
1. Start the dev server
2. Trigger the crawl via `/api/confluence-crawl`
3. Monitor progress
4. Verify results
5. Update documentation

**Add the credentials now and let me know when ready!**


