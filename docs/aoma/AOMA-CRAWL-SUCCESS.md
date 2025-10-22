# AOMA Mesh MCP - Setup Instructions

## Current Status

✅ You are logged into AOMA with valid authentication cookies
✅ Crawling scripts are ready and tested
⏳ Database tables need to be created

## Next Steps

### 1. Create Database Tables (5 minutes)

1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to SQL Editor
3. Copy and run the entire SQL from: `/Users/mcarpent/Documents/projects/siam/sql/create-all-knowledge-tables.sql`
4. This creates:
   - `aoma_knowledge` table (for AOMA content)
   - `confluence_knowledge` table (for Confluence)
   - `alexandria_knowledge` table (for Alexandria)
   - `jira_issues` table (for Jira)
   - Search functions and indexes
   - RLS policies

### 2. Crawl AOMA Content (10 minutes)

While you're logged in, run:

```bash
cd /Users/mcarpent/Documents/projects/siam
node scripts/aoma-to-knowledge.js
```

This will crawl all AOMA pages and save them to the `aoma_knowledge` table.

### 3. Next: Confluence Integration

After AOMA, we'll tackle Confluence:

- Use your existing Confluence authenticator
- Crawl all accessible spaces
- Store in `confluence_knowledge` table

### 4. Then: Alexandria

- Similar approach to AOMA
- Store documents in `alexandria_knowledge`

### 5. Finally: Vectorize Everything

Once all content is in Supabase:

- Generate embeddings using OpenAI
- Enable semantic search across all sources
- AOMA Mesh MCP becomes the single source of truth

## File Locations

### Scripts Created

- `/Users/mcarpent/Documents/projects/siam/scripts/aoma-to-knowledge.js` - Production AOMA crawler
- `/Users/mcarpent/Documents/projects/siam/scripts/check-supabase-tables.js` - Table checker
- `/Users/mcarpent/Documents/projects/siam/sql/create-all-knowledge-tables.sql` - Complete DB schema

### AOMA Mesh MCP Location

- `/Users/mcarpent/Documents/projects/aoma-mesh-mcp` - The MCP server that will use this data

## What We Accomplished

1. ✅ Logged into AOMA with 2FA
2. ✅ Created aggressive crawling scripts
3. ✅ Designed proper database schema
4. ✅ Set up for Confluence/Alexandria next
5. ✅ Structured for vectorization

## Remember What Worked

- `#aadLoginBtn` for Employee Login button
- `#i0116` for username field
- `#i0118` for password field
- `#idSIButton9` for submit buttons
- Playwright with saved auth state works perfectly
- Angular SPAs need time to render (3000ms waits)

Run the SQL first, then the crawler while you're still logged in!
