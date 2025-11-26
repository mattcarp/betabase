import { getGeminiEmbeddingService } from '../src/services/geminiEmbeddingService';
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Generate realistic AOMA knowledge base content
const DEMO_KNOWLEDGE = [
  // Architecture & System Design
  { category: "architecture", title: "AOMA System Overview", content: "AOMA (AI-Orchestrated Multi-Agent) is Sony Music's flagship digital asset management platform. It uses a microservices architecture with React frontend, Node.js backend, and PostgreSQL database. The system handles metadata management, digital rights, and content distribution for Sony Music's global catalog." },
  { category: "architecture", title: "AOMA Microservices", content: "AOMA consists of several microservices: Authentication Service (AWS Cognito), Metadata Service (handles track/album data), Rights Management Service (licensing and permissions), Search Service (Elasticsearch-based), and Analytics Service (usage tracking and reporting)." },
  { category: "architecture", title: "AOMA Database Schema", content: "The AOMA database uses a multi-tenant architecture with organization-level partitioning. Core tables include: tracks, albums, artists, labels, rights_agreements, usage_logs, and metadata_versions. All tables use UUID primary keys and include soft-delete functionality." },
  
  // API Documentation
  { category: "api", title: "AOMA REST API", content: "The AOMA REST API follows OpenAPI 3.0 specification. Base URL: https://api.aoma.sonymusic.com/v1. Authentication uses Bearer tokens from AWS Cognito. Rate limiting: 1000 requests/hour per API key. All responses are JSON with standard error codes." },
  { category: "api", title: "Track Metadata API", content: "GET /api/v1/tracks/{trackId} retrieves track metadata including ISRC, title, artists, album, duration, and rights information. POST /api/v1/tracks creates new tracks. PATCH /api/v1/tracks/{trackId} updates metadata. All endpoints require 'metadata:read' or 'metadata:write' scopes." },
  { category: "api", title: "Search API", content: "POST /api/v1/search performs full-text search across tracks, albums, and artists. Supports filters for genre, release date, label, and rights status. Returns paginated results with relevance scoring. Maximum 100 results per page." },
  
  // Authentication & Security
  { category: "security", title: "AOMA Authentication", content: "AOMA uses AWS Cognito for authentication with magic link (passwordless) login. Users receive a one-time code via email. Session tokens expire after 24 hours. Multi-factor authentication is required for admin roles." },
  { category: "security", title: "AOMA Authorization", content: "Role-based access control (RBAC) with roles: Admin, Curator, Viewer, API User. Permissions are hierarchical: Admin > Curator > Viewer. API access requires separate API keys with specific scopes." },
  { category: "security", title: "Data Encryption", content: "All data at rest is encrypted using AES-256. Data in transit uses TLS 1.3. Sensitive fields (rights agreements, financial data) use field-level encryption with AWS KMS." },
  
  // Features & Functionality
  { category: "features", title: "Metadata Management", content: "AOMA provides comprehensive metadata management for music assets. Supports standard formats: ID3v2, Vorbis Comments, APE tags. Automatic metadata extraction from audio files. Bulk editing capabilities for curators. Version history tracking for all metadata changes." },
  { category: "features", title: "Rights Management", content: "Digital rights management in AOMA tracks licensing agreements, territorial restrictions, and usage permissions. Supports complex rights scenarios including split copyrights, sampling clearances, and synchronization rights. Automated rights expiration notifications." },
  { category: "features", title: "Search & Discovery", content: "Advanced search with fuzzy matching, phonetic search for artist names, and semantic search for similar tracks. Faceted filtering by genre, mood, tempo, key, and instrumentation. Saved searches and custom collections." },
  
  // Development & Deployment
  { category: "devops", title: "AOMA Deployment", content: "AOMA runs on AWS ECS Fargate with auto-scaling based on CPU and memory metrics. Blue-green deployments for zero-downtime updates. Infrastructure as Code using Terraform. CI/CD pipeline via GitHub Actions." },
  { category: "devops", title: "Monitoring & Logging", content: "Application monitoring via Datadog with custom dashboards for API latency, error rates, and database performance. Centralized logging with CloudWatch Logs. Distributed tracing with AWS X-Ray. On-call rotation via PagerDuty." },
  { category: "devops", title: "Database Backups", content: "PostgreSQL automated daily backups with 30-day retention. Point-in-time recovery available for last 7 days. Backup validation runs weekly. Disaster recovery RTO: 4 hours, RPO: 15 minutes." },
  
  // Troubleshooting & Support
  { category: "support", title: "Common Issues", content: "Common AOMA issues: 1) 'Authentication failed' - check Cognito user pool status. 2) 'Metadata sync failed' - verify S3 bucket permissions. 3) 'Search timeout' - check Elasticsearch cluster health. 4) 'Rights validation error' - ensure rights agreements are current." },
  { category: "support", title: "Performance Optimization", content: "AOMA performance best practices: Use pagination for large result sets. Cache frequently accessed metadata. Batch API requests when possible. Use GraphQL for complex queries to reduce over-fetching. Enable CDN caching for static assets." },
  { category: "support", title: "Error Codes", content: "AOMA error codes: 4001 - Invalid authentication token. 4002 - Insufficient permissions. 4003 - Resource not found. 4004 - Rate limit exceeded. 5001 - Database connection error. 5002 - External service unavailable. 5003 - Internal server error." },
];

async function generateDemoData() {
  console.log('🎬 Generating AOMA Demo Knowledge Base...\n');
  
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });
  
  await client.connect();
  const geminiService = getGeminiEmbeddingService();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < DEMO_KNOWLEDGE.length; i++) {
    const doc = DEMO_KNOWLEDGE[i];
    try {
      console.log(`[${i + 1}/${DEMO_KNOWLEDGE.length}] ${doc.title}`);
      const embedding = await geminiService.generateEmbedding(doc.content);
      
      const result = await client.query(
        `SELECT upsert_siam_vector_gemini($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          'sony-music',
          'digital-operations',
          'aoma',
          doc.content,
          `[${embedding.join(',')}]`,
          'knowledge',
          `demo-${doc.category}-${i}`,
          JSON.stringify({ title: doc.title, category: doc.category })
        ]
      );
      console.log(`  ✅ ID: ${result.rows[0].upsert_siam_vector_gemini}`);
      successCount++;
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
  }
  
  await client.end();
  
  console.log('\n' + '='.repeat(60));
  console.log(`✨ Demo data generation complete!`);
  console.log(`📊 Success: ${successCount}, Errors: ${errorCount}`);
  console.log('='.repeat(60));
  
  // Run a test query
  console.log('\n🧪 Running test query...');
  const testClient = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });
  await testClient.connect();
  
  const countResult = await testClient.query(
    `SELECT COUNT(*) as total FROM siam_vectors WHERE organization='sony-music' AND division='digital-operations' AND app_under_test='aoma'`
  );
  console.log(`📈 Total vectors in database: ${countResult.rows[0].total}`);
  
  await testClient.end();
}

generateDemoData().catch(console.error);
