# System Metrics Ingestion Pipeline

## Overview

The System Metrics Ingestion Pipeline enables automated collection, vectorization, and semantic search of system metrics and telemetry data. Metrics are embedded using OpenAI's text-embedding model and stored in the unified Supabase vector store.

## Architecture

```
System Metrics → Collection → Vectorization → Vector Store → Semantic Search
     ↓              ↓              ↓              ↓              ↓
  Node.js       Service        OpenAI        Supabase      Search API
  Performance   Layer         Embeddings      pgvector      Results
```

## Features

- ✅ **Automated System Snapshots**: Capture CPU, memory, and process metrics
- ✅ **Custom Metrics Recording**: Track application-specific metrics
- ✅ **Batch Ingestion**: Efficiently process multiple metrics at once
- ✅ **Semantic Search**: Find metrics using natural language queries
- ✅ **Time-based Filtering**: Query metrics by time range and type
- 🔄 **Future: Prometheus Integration**: Ready for Prometheus endpoint integration
- 🔄 **Future: Grafana Integration**: Prepared for Grafana API integration

## Components

### 1. System Metrics Vector Service

**File**: `src/services/systemMetricsVectorService.ts`

Core service for collecting and vectorizing metrics:

```typescript
import { getSystemMetricsVectorService } from "@/services/systemMetricsVectorService";

const metricsService = getSystemMetricsVectorService();

// Capture system snapshot
const result = await metricsService.captureAndVectorize();

// Record custom metric
await metricsService.recordCustomMetric("api.responseTime", 125.5, {
  metricType: "api",
  unit: "milliseconds",
  tags: { endpoint: "/api/chat" },
});

// Search metrics
const results = await metricsService.searchMetrics("API response time");
```

### 2. API Endpoints

#### POST /api/metrics/ingest

Ingest metrics into the vector store.

**Actions**:

- `snapshot`: Capture current system snapshot
- `custom`: Record a single custom metric
- `batch`: Ingest multiple metrics at once

**Examples**:

```bash
# Capture system snapshot
curl -X POST http://localhost:3000/api/metrics/ingest \
  -H "Content-Type: application/json" \
  -d '{"action": "snapshot"}'

# Record custom metric
curl -X POST http://localhost:3000/api/metrics/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "action": "custom",
    "name": "api.chat.responseTime",
    "value": 2340.2,
    "metricType": "api",
    "unit": "milliseconds",
    "tags": {"endpoint": "/api/chat"}
  }'

# Batch ingest
curl -X POST http://localhost:3000/api/metrics/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "action": "batch",
    "metrics": [
      {
        "timestamp": "2025-10-22T10:00:00Z",
        "metricType": "api",
        "name": "api.endpoint1.responseTime",
        "value": 150,
        "unit": "milliseconds"
      },
      {
        "timestamp": "2025-10-22T10:00:00Z",
        "metricType": "error",
        "name": "api.errorRate",
        "value": 0.5,
        "unit": "percent"
      }
    ]
  }'
```

#### POST /api/metrics/search

Search vectorized metrics using semantic search.

**Example**:

```bash
curl -X POST http://localhost:3000/api/metrics/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "API response time performance",
    "matchThreshold": 0.7,
    "matchCount": 10,
    "metricType": "api"
  }'
```

#### GET /api/metrics/stats

Get statistics about vectorized metrics.

**Example**:

```bash
curl http://localhost:3000/api/metrics/stats
```

#### GET /api/metrics/ingest

Get in-memory metrics history.

**Example**:

```bash
# Get all metrics
curl http://localhost:3000/api/metrics/ingest

# Filter by type
curl http://localhost:3000/api/metrics/ingest?metricType=api&limit=20

# Filter by name pattern
curl http://localhost:3000/api/metrics/ingest?namePattern=response&limit=10
```

## Metric Types

The system supports the following metric types:

- **performance**: Application performance metrics (load time, render time, etc.)
- **resource**: System resource metrics (CPU, memory, disk, etc.)
- **api**: API endpoint metrics (response time, throughput, etc.)
- **error**: Error rates and error-related metrics
- **custom**: User-defined custom metrics

## Metric Structure

```typescript
interface SystemMetric {
  timestamp: string;
  metricType: "performance" | "resource" | "api" | "error" | "custom";
  name: string;
  value: number | string | Record<string, any>;
  unit?: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}
```

## Usage Examples

### 1. Automated Metrics Collection

Set up automated collection that runs every minute:

```typescript
import { getSystemMetricsVectorService } from "@/services/systemMetricsVectorService";

const metricsService = getSystemMetricsVectorService();

// Collect metrics every 60 seconds
const interval = metricsService.setupAutomatedCollection(60000);

// Stop collection
clearInterval(interval);
```

### 2. Track API Performance

```typescript
import { getSystemMetricsVectorService } from "@/services/systemMetricsVectorService";

const metricsService = getSystemMetricsVectorService();

// In your API route
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ... your API logic ...

    const duration = Date.now() - startTime;

    // Record the metric
    await metricsService.recordCustomMetric("api.endpoint.responseTime", duration, {
      metricType: "api",
      unit: "milliseconds",
      tags: {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        status: "success",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Record error metric
    await metricsService.recordCustomMetric("api.endpoint.error", 1, {
      metricType: "error",
      tags: {
        endpoint: request.nextUrl.pathname,
        errorType: error.name,
      },
    });

    throw error;
  }
}
```

### 3. Search Historical Metrics

```typescript
import { getSystemMetricsVectorService } from "@/services/systemMetricsVectorService";

const metricsService = getSystemMetricsVectorService();

// Find slow API endpoints
const slowEndpoints = await metricsService.searchMetrics("slow API response time over 2 seconds", {
  matchThreshold: 0.7,
  metricType: "api",
  timeRange: {
    start: "2025-10-22T00:00:00Z",
    end: "2025-10-22T23:59:59Z",
  },
});

// Find error spikes
const errors = await metricsService.searchMetrics("authentication errors", {
  matchThreshold: 0.75,
  metricType: "error",
});
```

## Testing

### Run Playwright Tests

```bash
# Run all metrics ingestion tests
npx playwright test tests/metrics-ingestion.spec.ts

# Run specific test
npx playwright test tests/metrics-ingestion.spec.ts -g "capture and vectorize"

# Run with UI
npx playwright test tests/metrics-ingestion.spec.ts --ui
```

### Manual Testing

```bash
# 1. Start the development server
npm run dev

# 2. Capture a system snapshot
curl -X POST http://localhost:3000/api/metrics/ingest \
  -H "Content-Type: application/json" \
  -d '{"action": "snapshot"}'

# 3. Check the stats
curl http://localhost:3000/api/metrics/stats

# 4. Search for metrics
curl -X POST http://localhost:3000/api/metrics/search \
  -H "Content-Type: application/json" \
  -d '{"query": "CPU usage memory", "matchCount": 5}'
```

## Integration with AOMA

The metrics ingestion pipeline is designed to work seamlessly with the AOMA orchestrator:

```typescript
import { getSystemMetricsVectorService } from "@/services/systemMetricsVectorService";

// In AOMA orchestrator, track performance
const metricsService = getSystemMetricsVectorService();

const startTime = Date.now();
const response = await orchestrateQuery(query);
const duration = Date.now() - startTime;

await metricsService.recordCustomMetric("aoma.orchestration.duration", duration, {
  metricType: "performance",
  unit: "milliseconds",
  tags: {
    complexity: response.complexity,
    sourcesQueried: response.sources.length,
  },
});
```

## Future Enhancements

### Prometheus Integration

```typescript
// Will support pulling metrics from Prometheus
await metricsService.ingestPrometheusMetrics("http://prometheus:9090");
```

### Grafana Integration

```typescript
// Will support pulling dashboard metrics from Grafana
await metricsService.ingestGrafanaMetrics("http://grafana:3000", "grafana_api_key");
```

### Real-time Monitoring Dashboard

Future UI component to visualize metrics in real-time, with charts, alerts, and anomaly detection.

## Performance Considerations

- **Batch Processing**: Metrics are vectorized in batches (default 5 at a time) to avoid overwhelming the OpenAI API
- **In-Memory Cache**: Recent metrics (last 1000) are kept in memory for quick access
- **Async Vectorization**: Can optionally disable immediate vectorization for high-frequency metrics
- **Efficient Search**: Uses Supabase's pgvector with HNSW indexing for fast similarity search

## Monitoring

The pipeline tracks its own performance:

- Total metrics ingested
- Successful vectorizations
- Failed vectorizations
- Average vectorization time
- Vector store size

All available via `/api/metrics/stats`.

## Troubleshooting

### Metrics not appearing in search

1. Check vectorization was successful: `curl http://localhost:3000/api/metrics/stats`
2. Verify vector store connection: Check Supabase admin client is initialized
3. Wait 1-2 seconds after ingestion before searching (vectorization is async)

### High failure rate

1. Check OpenAI API key is configured: `OPENAI_API_KEY` in environment
2. Verify Supabase service role key: `SUPABASE_SERVICE_ROLE_KEY` in environment
3. Check API rate limits on OpenAI

### Search returns no results

1. Lower the `matchThreshold` (default 0.78, try 0.5)
2. Increase `matchCount` to get more results
3. Use more specific search terms
4. Check if metrics were actually ingested

## Related Documentation

- [AOMA Unified Vector Store Architecture](./AOMA-Unified-Vector-Store-Architecture.md)
- [Vector Store Breakthrough](./VECTOR_STORE_BREAKTHROUGH.md)
- [Testing Fundamentals](../TESTING_FUNDAMENTALS.md)

## Dependencies

- Task 66: Data Ingestion Framework ✅ Complete
- Supabase with pgvector extension ✅ Complete
- OpenAI API for embeddings ✅ Complete
- SupabaseVectorService ✅ Complete

---

**Status**: ✅ **COMPLETE** - Ready for production use

**Last Updated**: October 22, 2025
