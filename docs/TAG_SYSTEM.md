# SIAM Documentation Tag System

## Purpose
Enable efficient content discovery and video production for technical demonstrations to senior engineering colleagues.

## Tag Format
Tags are embedded in markdown files using HTML comments to keep them invisible in rendered docs:
```markdown
<!-- TAGS: architecture, ai-integration, production -->
```

## Tag Taxonomy

### 🏗️ Architecture Tags
- `architecture` - System design and structure
- `microservices` - Service-oriented architecture
- `infrastructure` - Deployment and hosting
- `scalability` - Performance and scaling strategies
- `security` - Security architecture and practices
- `data-flow` - Data pipelines and flow
- `integration` - System integration points

### 🤖 AI/ML Tags
- `ai-integration` - AI service integration
- `llm` - Large Language Model features
- `rag` - Retrieval Augmented Generation
- `vector-store` - Vector database and embeddings
- `semantic-search` - Semantic search capabilities
- `ai-curation` - AI-powered content curation
- `ml-pipeline` - Machine learning pipelines
- `prompt-engineering` - Prompt design patterns

### 🧪 Technical Implementation
- `mcp-servers` - Model Context Protocol servers
- `api-design` - API architecture and patterns
- `real-time` - Real-time features and WebSockets
- `authentication` - Auth implementation (Cognito, etc.)
- `database` - Database design and queries
- `caching` - Caching strategies
- `optimization` - Performance optimizations
- `testing` - Testing strategies and frameworks

### 📊 Knowledge Management
- `knowledge-curation` - Content curation features
- `deduplication` - Duplicate detection algorithms
- `metadata` - Metadata extraction and enrichment
- `compliance` - Compliance and regulatory features
- `knowledge-graph` - Knowledge graph implementation
- `analytics` - Analytics and reporting
- `roi-metrics` - ROI and value measurement

### 🎯 Feature Categories
- `dashboard` - Dashboard implementations
- `visualization` - Data visualization (charts, graphs)
- `search` - Search functionality
- `file-management` - File upload/delete/manage
- `collaboration` - Multi-user features
- `gamification` - Leaderboards and badges
- `automation` - Automated workflows

### 🚀 Production & Operations
- `production` - Production deployment
- `monitoring` - System monitoring
- `logging` - Logging strategies
- `ci-cd` - CI/CD pipelines
- `docker` - Containerization
- `render-deployment` - Render.com specifics
- `troubleshooting` - Debug and troubleshooting

### 💡 Innovation & Advanced
- `innovation` - Cutting-edge features
- `experimental` - Experimental features
- `poc` - Proof of concepts
- `case-study` - Real-world usage examples
- `lessons-learned` - Engineering insights
- `best-practices` - Recommended patterns

### 📹 Video Production Helper Tags
- `demo-ready` - Polished features ready for demo
- `visual-impact` - Visually impressive features
- `technical-depth` - Deep technical content
- `problem-solving` - Shows problem-solving approach
- `architecture-decision` - Key architectural decisions
- `performance-showcase` - Performance improvements
- `innovation-highlight` - Innovative solutions

## Usage Examples

### Example 1: Architecture Document
```markdown
<!-- TAGS: architecture, microservices, mcp-servers, technical-depth, architecture-decision -->
# SIAM System Architecture
...
```

### Example 2: AI Curation Feature
```markdown
<!-- TAGS: ai-curation, knowledge-curation, roi-metrics, demo-ready, innovation-highlight -->
# Enhanced Knowledge Curation with AI
...
```

### Example 3: Production Deployment
```markdown
<!-- TAGS: production, render-deployment, ci-cd, monitoring, lessons-learned -->
# Production Deployment Strategy
...
```

## Video Production Queries

### For Architecture Overview Video
Search for: `architecture, infrastructure, data-flow, technical-depth`

### For AI Innovation Video
Search for: `ai-integration, llm, innovation-highlight, demo-ready`

### For Knowledge Management Deep Dive
Search for: `knowledge-curation, deduplication, roi-metrics, visual-impact`

### For Production Engineering Video
Search for: `production, monitoring, troubleshooting, lessons-learned`

## Tag Search Script

Create a simple search script to find documents by tags:

```bash
#!/bin/bash
# find-by-tags.sh
TAG=$1
echo "Finding documents with tag: $TAG"
grep -r "TAGS:.*$TAG" docs/ --include="*.md" | cut -d: -f1 | sort -u
```

## Best Practices

1. **Use 3-5 tags per document** - Enough for discovery, not overwhelming
2. **Include both category and specificity** - e.g., `architecture, mcp-servers`
3. **Add video production tags** - Help identify demo-worthy content
4. **Tag technical depth** - Mark content suitable for senior engineers
5. **Update tags when content changes** - Keep tags current with content

## Tag Maintenance

Periodically run tag analysis:
```bash
# Count tag usage
grep -rh "TAGS:" docs/ --include="*.md" | \
  sed 's/<!-- TAGS: //' | sed 's/ -->//' | \
  tr ',' '\n' | sed 's/^ *//' | \
  sort | uniq -c | sort -rn
```

This helps identify:
- Overused tags (too generic)
- Underused tags (too specific)
- Missing tag categories
- Tag consistency issues