# AOMA Migration - Key Jira Tickets Report

**Report Date:** October 2025
**Project:** AOMA Cloud Migration (Phase 2)

## Critical Migration Tickets

### Database Migration
*   **[AOMA-101]** Migrate PostgreSQL Metadata to Aurora Serverless v2
    *   **Status:** DONE
    *   **Assignee:** DB Team
    *   **Notes:** Successfully migrated 2TB of metadata with zero downtime using DMS.

### API Gateway
*   **[AOMA-102]** Update API Gateway to support WebSocket connections for real-time status
    *   **Status:** IN PROGRESS
    *   **Assignee:** Backend Team
    *   **Notes:** Required for the new "Unified Session Manager" (USM) feature.

### Frontend
*   **[AOMA-105]** Refactor "Asset Detail" page to use new React Server Components
    *   **Status:** REVIEW
    *   **Assignee:** Frontend Team
    *   **Notes:** Improved LCP by 40%.

## Related Code Commits
*   `feat(db): switch connection pool to pg-bouncer for Aurora` (Commit: 7a8b9c)
*   `fix(api): handle websocket disconnects gracefully` (Commit: 2d3e4f)
