# AOMA Documentation Index

**Last Updated**: January 2025

This document provides a comprehensive index of all AOMA-related documentation in the SIAM project.

---

## 🚨 Current Status (START HERE)

**[AOMA-STAGE-AUTHENTICATION-STATUS.md](./AOMA-STAGE-AUTHENTICATION-STATUS.md)** - **READ THIS FIRST**

- **Status**: 🚫 BLOCKED - Certificate authentication failure
- Current authentication issue with Microsoft Conditional Access
- Jamf MDM enrollment requirement blocker
- Technical details of authentication flow
- Scripts status and path forward

---

## 📚 Core Documentation

### Architecture & Integration

**[AOMA-Unified-Vector-Store-Architecture.md](./AOMA-Unified-Vector-Store-Architecture.md)**

- Unified vector store design for AOMA + Jira knowledge
- Single embedding approach with source metadata
- Query patterns and retrieval strategies

**[SIAM_TO_AOMA_CONNECTION.md](./SIAM_TO_AOMA_CONNECTION.md)**

- Complete guide connecting SIAM to aoma-mesh-mcp server
- API endpoints and authentication flow
- Deployment information (Railway URLs purged September 2024)

**[AOMA-Unified-Vector-Store-Architecture.md](./AOMA-Unified-Vector-Store-Architecture.md)**

- Vector database schema and implementation
- Embedding generation strategy
- Search and retrieval patterns

### Crawling & Data Collection

**[AOMA-FIRECRAWL-INTEGRATION.md](./AOMA-FIRECRAWL-INTEGRATION.md)**

- Firecrawl v2 API integration guide
- Authentication handling with cookies
- Crawl configuration and patterns

**[AOMA-FIRECRAWL-STATUS-REPORT.md](./AOMA-FIRECRAWL-STATUS-REPORT.md)**

- Current status of Firecrawl integration
- Issues and blockers
- Implementation progress

**[demo-preparation/aoma-crawling-guide.md](./demo-preparation/aoma-crawling-guide.md)**

- Step-by-step crawling guide for demos
- Authentication setup
- Troubleshooting tips

**[../AOMA-CRAWL-SUCCESS.md](../AOMA-CRAWL-SUCCESS.md)** ⚠️ _Should be moved to docs/_

- Documentation of successful crawl
- Data collected and stored
- Validation results

### Performance & Optimization

**[AOMA_PERFORMANCE_ANALYSIS.md](./AOMA_PERFORMANCE_ANALYSIS.md)**

- Performance metrics and analysis
- Response time measurements
- Bottleneck identification

**[AOMA_PERFORMANCE_ROOT_CAUSE.md](./AOMA_PERFORMANCE_ROOT_CAUSE.md)**

- Root cause analysis of performance issues
- Database query performance
- Vector search optimization

**[AOMA_OPTIMIZATION_COMPARISON.md](./AOMA_OPTIMIZATION_COMPARISON.md)**

- Before/after optimization comparisons
- Benchmark results
- Improvement strategies

### Vector Store & Search

**[AOMA_VECTOR_STORE_REALITY.md](./AOMA_VECTOR_STORE_REALITY.md)**

- Current state of vector store implementation
- Real-world performance characteristics
- Limitations and constraints

**[AOMA_VECTOR_STORE_SOLUTION.md](./AOMA_VECTOR_STORE_SOLUTION.md)**

- Solution design for vector store issues
- Implementation plan
- Migration strategy

### Testing & Validation

**[AOMA_TEST_RESULTS.md](./AOMA_TEST_RESULTS.md)**

- Initial test results
- Test scenarios and coverage
- Issues discovered

**[AOMA_FINAL_TEST_RESULTS.md](./AOMA_FINAL_TEST_RESULTS.md)**

- Final validation results
- Production readiness assessment
- Outstanding issues

**[AOMA_REAL_RESPONSES.md](./AOMA_REAL_RESPONSES.md)**

- Real response examples from AOMA
- Quality assessment
- Hallucination prevention validation

---

## 📦 Release Information

**[AOMA_Release_Notes_2.113.0.md](./AOMA_Release_Notes_2.113.0.md)**

- Release notes for AOMA version 2.113.0
- New features and changes
- Migration notes

---

## 🚨 Critical Issues & Memory

**[CRITICAL_AOMA_ISSUE.md](./CRITICAL_AOMA_ISSUE.md)**

- Critical issues encountered
- Urgent fixes required
- Impact assessment

**[MEMORY_AOMA_RAILWAY.md](./MEMORY_AOMA_RAILWAY.md)** ⚠️ _OUTDATED - Railway removed September 2024_

- Historical memory of Railway deployment
- Now superseded by Render.com deployment
- Kept for historical reference only

---

## 🗂️ File Organization

### Active Documentation (docs/)

```
docs/
├── AOMA-STAGE-AUTHENTICATION-STATUS.md       ⭐ START HERE
├── AOMA-DOCUMENTATION-INDEX.md               📚 This file
├── AOMA-Unified-Vector-Store-Architecture.md
├── AOMA-FIRECRAWL-INTEGRATION.md
├── AOMA-FIRECRAWL-STATUS-REPORT.md
├── AOMA_Release_Notes_2.113.0.md
├── AOMA_PERFORMANCE_ANALYSIS.md
├── AOMA_PERFORMANCE_ROOT_CAUSE.md
├── AOMA_OPTIMIZATION_COMPARISON.md
├── AOMA_VECTOR_STORE_REALITY.md
├── AOMA_VECTOR_STORE_SOLUTION.md
├── AOMA_TEST_RESULTS.md
├── AOMA_FINAL_TEST_RESULTS.md
├── AOMA_REAL_RESPONSES.md
├── CRITICAL_AOMA_ISSUE.md
├── MEMORY_AOMA_RAILWAY.md (outdated)
├── SIAM_TO_AOMA_CONNECTION.md
└── demo-preparation/
    └── aoma-crawling-guide.md
```

### Source Code (src/)

```
src/
├── services/
│   ├── aomaStageAuthenticator.ts        🔐 Authentication service
│   └── aomaFirecrawlService.ts          🕷️ Crawling service
└── utils/
    └── [AOMA-related utilities]
```

### Scripts (scripts/)

```
scripts/
├── aoma-stage-login.js                  🤖 Automated login (HITL 2FA)
├── aoma-manual-login-save.js            👤 Manual login with cookie save
├── aoma-playwright-crawler.js           🕷️ Playwright-based crawler
└── aoma-login-playwright.js             🔄 Original login script
```

### Context Files (context/)

```
context/
└── firecrawl-v2-migration.md            📝 Firecrawl v2 API migration guide
```

### Temporary Files (tmp/)

```
tmp/
├── aoma-stage-storage.json              💾 Saved Playwright storage
├── aoma-cookie.txt                      🍪 Saved cookies
├── auth-flow-end.png                    📸 Debug screenshots
├── check-*s.png                         📸 Auth flow screenshots
├── crawled/                             📦 Old crawl artifacts (can be cleaned)
└── crawled-content/                     📦 Crawled content (can be cleaned)
```

---

## 🔍 Quick Reference by Topic

### Authentication

- [AOMA-STAGE-AUTHENTICATION-STATUS.md](./AOMA-STAGE-AUTHENTICATION-STATUS.md) - Current blocker
- `scripts/aoma-stage-login.js` - Automated login script
- `scripts/aoma-manual-login-save.js` - Manual login script
- `src/services/aomaStageAuthenticator.ts` - Auth service

### Crawling & Data Collection

- [AOMA-FIRECRAWL-INTEGRATION.md](./AOMA-FIRECRAWL-INTEGRATION.md) - Integration guide
- [AOMA-FIRECRAWL-STATUS-REPORT.md](./AOMA-FIRECRAWL-STATUS-REPORT.md) - Status
- [demo-preparation/aoma-crawling-guide.md](./demo-preparation/aoma-crawling-guide.md) - Demo guide
- `src/services/aomaFirecrawlService.ts` - Crawling service
- `scripts/aoma-playwright-crawler.js` - Crawler script
- `context/firecrawl-v2-migration.md` - API migration

### Architecture & Design

- [AOMA-Unified-Vector-Store-Architecture.md](./AOMA-Unified-Vector-Store-Architecture.md) - Architecture
- [AOMA_VECTOR_STORE_REALITY.md](./AOMA_VECTOR_STORE_REALITY.md) - Current state
- [AOMA_VECTOR_STORE_SOLUTION.md](./AOMA_VECTOR_STORE_SOLUTION.md) - Solutions
- [SIAM_TO_AOMA_CONNECTION.md](./SIAM_TO_AOMA_CONNECTION.md) - Connection guide

### Performance & Optimization

- [AOMA_PERFORMANCE_ANALYSIS.md](./AOMA_PERFORMANCE_ANALYSIS.md) - Analysis
- [AOMA_PERFORMANCE_ROOT_CAUSE.md](./AOMA_PERFORMANCE_ROOT_CAUSE.md) - Root cause
- [AOMA_OPTIMIZATION_COMPARISON.md](./AOMA_OPTIMIZATION_COMPARISON.md) - Comparison

### Testing & Validation

- [AOMA_TEST_RESULTS.md](./AOMA_TEST_RESULTS.md) - Test results
- [AOMA_FINAL_TEST_RESULTS.md](./AOMA_FINAL_TEST_RESULTS.md) - Final results
- [AOMA_REAL_RESPONSES.md](./AOMA_REAL_RESPONSES.md) - Response quality
- `tests/production/aoma-chat-test.spec.ts` - Production chat tests

---

## 📋 Documentation Maintenance

### Files to Clean Up

- `AOMA-CRAWL-SUCCESS.md` - Should be moved from root to `docs/`
- `tmp/crawled/` - Old crawl artifacts, can be archived or deleted
- `tmp/crawled-content/` - Old crawled content, can be archived
- `docs/MEMORY_AOMA_RAILWAY.md` - Outdated, Railway removed September 2024

### Documentation Standards

- All AOMA documentation should be in `docs/` directory
- Use prefix `AOMA-` or `AOMA_` for consistency
- Include "Last Updated" date at top of each file
- Link to this index from CLAUDE.md
- Keep authentication status doc (`AOMA-STAGE-AUTHENTICATION-STATUS.md`) as single source of truth for current blockers

---

## 🔗 External Resources

### AOMA Stage Environment

- **URL**: https://aoma-stage.smcdp-de.net
- **VPN**: GlobalProtect required
- **OAuth App ID**: `72e97d60-6868-4706-9caa-6781093d61ca`

### aoma-mesh-mcp Server (Railway URLs PURGED - Use Render)

- **Production**: Deployed on Render.com (see SIAM_TO_AOMA_CONNECTION.md)
- **Local Development**: http://localhost:3001

### Related Jira Documentation

- Jira integration shares the unified vector store
- See `docs/development/JIRA_TESTING_INTEGRATION.md`

---

## 📞 Support & Troubleshooting

### Common Issues

1. **Authentication Fails** → See [AOMA-STAGE-AUTHENTICATION-STATUS.md](./AOMA-STAGE-AUTHENTICATION-STATUS.md)
2. **Crawl Errors** → See [AOMA-FIRECRAWL-STATUS-REPORT.md](./AOMA-FIRECRAWL-STATUS-REPORT.md)
3. **Performance Issues** → See [AOMA_PERFORMANCE_ROOT_CAUSE.md](./AOMA_PERFORMANCE_ROOT_CAUSE.md)
4. **Vector Store Issues** → See [AOMA_VECTOR_STORE_SOLUTION.md](./AOMA_VECTOR_STORE_SOLUTION.md)

### Debug Commands

```bash
# Check authentication status
node scripts/aoma-manual-login-save.js

# Run crawler
node scripts/aoma-playwright-crawler.js

# Check vector store
npm run test:e2e tests/production/aoma-chat-test.spec.ts
```

---

**Navigation**:

- **Root Documentation**: [../CLAUDE.md](../CLAUDE.md)
- **Testing Documentation**: [TESTING_FUNDAMENTALS.md](./TESTING_FUNDAMENTALS.md)
- **Production Testing**: [PRODUCTION_TESTING.md](./PRODUCTION_TESTING.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
