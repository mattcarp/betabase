# Performance Monitoring and Analytics System

## Overview

The Performance Monitoring and Analytics System provides comprehensive real-time monitoring of SIAM's performance, including query response times, system resource usage, data freshness, and API endpoint performance.

## Architecture

### Components

1. **Performance Dashboard** (`/app/performance/page.tsx`)
   - Real-time monitoring interface
   - Multi-tab layout for different metric categories
   - Interactive charts using Recharts
   - Auto-refresh capability

2. **Metrics API** (`/app/api/performance/metrics/route.ts`)
   - GET: Retrieves comprehensive performance metrics
   - POST: Records new performance metrics
   - Supports time range filtering (1h, 6h, 24h, 7d)

3. **Performance Tracker Service** (`/src/services/performanceTracker.ts`)
   - Client-side performance tracking
   - Operation timing and measurement
   - In-memory metrics storage
   - Background persistence to API

## Features

### 1. Query Analytics

Tracks and analyzes query performance:

- **Response Time Metrics**
  - Average response time
  - P50, P95, P99 latency percentiles
  - Real-time trend charts

- **Query Type Distribution**
  - Breakdown by query type (user, assistant, system)
  - Average time per query type
  - Request count by type

- **Success Metrics**
  - Success rate percentage
  - Error rate tracking
  - Error distribution analysis

### 2. System Health Monitoring

Real-time system resource tracking:

- **CPU Usage**
  - Current usage percentage
  - Historical trends
  - Warning/critical thresholds

- **Memory Usage**
  - Memory consumption tracking
  - Usage patterns over time
  - Memory pressure indicators

- **Disk Usage**
  - Disk space utilization
  - Storage trends
  - Capacity warnings

- **Network Status**
  - Network latency
  - Connection stability
  - Uptime tracking

### 3. Data Freshness Tracking

Monitors data currency and cache performance:

- **Vector Store**
  - Total document count
  - Last update timestamp
  - Data staleness (in hours)
  - Staleness warnings (>24h = warning, >72h = critical)

- **AOMA Cache**
  - Cache hit rate
  - Cache miss rate
  - Cache effectiveness metrics

- **Knowledge Base**
  - File count
  - Last update timestamp
  - Content freshness indicators

### 4. API Performance

Endpoint-level performance monitoring:

- **Per-Endpoint Metrics**
  - Average latency
  - Request count
  - Error count
  - Error rate percentage

- **Monitored Endpoints**
  - `/api/chat` - Chat API performance
  - `/api/aoma-mcp` - AOMA MCP performance
  - `/api/vector-store` - Vector search performance
  - `/api/upload` - File upload performance

## Usage

### Accessing the Dashboard

Navigate to `/performance` in your browser:

```
http://localhost:3000/performance
```

### Dashboard Controls

- **Refresh Button**: Manually refresh metrics
- **Auto-refresh Toggle**: Enable/disable automatic updates (10s interval)
- **Time Range Selector**: Choose data window (1H, 6H, 24H, 7D)
- **Tab Navigation**: Switch between metric categories

### Health Status Indicators

The dashboard shows overall system status:

- **🟢 HEALTHY**: All systems operating normally
  - CPU < 70%, Memory < 70%
  - Error rate < 5%
  - Data staleness < 24h

- **🟡 WARNING**: Some systems need attention
  - CPU 70-90%, Memory 70-90%
  - Error rate 5-10%
  - Data staleness 24-72h

- **🔴 CRITICAL**: Immediate action required
  - CPU > 90%, Memory > 90%
  - Error rate > 10%
  - Data staleness > 72h

## API Reference

### GET /api/performance/metrics

Retrieves comprehensive performance metrics.

**Query Parameters:**
- `timeRange` (optional): Time window for metrics
  - Values: `1h`, `6h`, `24h`, `7d`
  - Default: `1h`

**Response:**
```typescript
{
  queryMetrics: {
    avgResponseTime: number,
    p50ResponseTime: number,
    p95ResponseTime: number,
    p99ResponseTime: number,
    totalQueries: number,
    successRate: number,
    errorRate: number,
    queryTypes: [{
      type: string,
      count: number,
      avgTime: number
    }]
  },
  systemMetrics: {
    cpuUsage: number,
    memoryUsage: number,
    diskUsage: number,
    networkLatency: number,
    uptime: number
  },
  dataFreshness: {
    vectorStore: {
      lastUpdate: string,
      totalDocuments: number,
      staleness: number
    },
    aomaCache: {
      lastUpdate: string,
      cacheHitRate: number,
      cacheMissRate: number
    },
    knowledgeBase: {
      lastUpdate: string,
      fileCount: number
    }
  },
  apiMetrics: [{
    endpoint: string,
    avgLatency: number,
    requestCount: number,
    errorCount: number
  }],
  timestamp: string
}
```

### POST /api/performance/metrics

Records a new performance metric.

**Request Body:**
```typescript
{
  type: string,           // e.g., "query:chat", "api:vector-search"
  duration: number,       // Duration in milliseconds
  metadata: {             // Optional metadata
    success: boolean,
    error?: string,
    [key: string]: any
  }
}
```

**Response:**
```typescript
{
  success: boolean
}
```

## Performance Tracker Service

### Usage in Code

```typescript
import { performanceTracker } from '@/services/performanceTracker';

// Track a query
const result = await performanceTracker.trackQuery(
  'user-search',
  async () => {
    return await searchVectorStore(query);
  },
  { userId: 'user-123' }
);

// Track an API call
const data = await performanceTracker.trackApiCall(
  '/api/chat',
  async () => {
    return await fetch('/api/chat', { method: 'POST', body });
  }
);

// Track a render operation
const stopTracking = performanceTracker.trackRender('ChatComponent');
// ... component renders ...
stopTracking();
```

### Hook for React Components

```typescript
import { usePerformanceTracking } from '@/services/performanceTracker';

function MyComponent() {
  const { trackQuery, trackRender } = usePerformanceTracking();

  useEffect(() => {
    const stop = trackRender('MyComponent');
    return stop;
  }, []);

  const handleSearch = async (query: string) => {
    const results = await trackQuery('search', async () => {
      return await searchAPI(query);
    });
  };
}
```

## Testing

Comprehensive test suite at `/tests/performance-dashboard.spec.ts`:

```bash
# Run performance dashboard tests
npx playwright test tests/performance-dashboard.spec.ts

# Run with UI
npx playwright test tests/performance-dashboard.spec.ts --ui

# Run specific test
npx playwright test tests/performance-dashboard.spec.ts -g "should load performance dashboard"
```

### Test Coverage

- ✅ Dashboard loading and rendering
- ✅ Tab navigation
- ✅ Chart rendering
- ✅ Refresh functionality
- ✅ Auto-refresh toggle
- ✅ Time range selection
- ✅ API endpoint validation
- ✅ Error handling
- ✅ Mobile responsiveness
- ✅ Console error detection
- ✅ Performance measurements

## Performance Targets

### Query Performance
- **P50**: < 500ms
- **P95**: < 1000ms
- **P99**: < 2000ms
- **Success Rate**: > 95%
- **Error Rate**: < 5%

### System Resources
- **CPU**: < 70% normal, < 90% peak
- **Memory**: < 70% normal, < 90% peak
- **Disk**: < 80% capacity

### Data Freshness
- **Vector Store**: < 24h staleness
- **Cache Hit Rate**: > 80%
- **Knowledge Base**: < 7d since last update

### API Performance
- **Average Latency**: < 300ms
- **Error Rate**: < 2%
- **Availability**: > 99.5%

## Monitoring Best Practices

### 1. Regular Review
- Check dashboard daily
- Review weekly trends
- Investigate anomalies promptly

### 2. Threshold Alerts
- Set up alerts for critical thresholds
- Monitor staleness indicators
- Track error rate spikes

### 3. Performance Optimization
- Use metrics to identify bottlenecks
- Track impact of code changes
- Optimize based on P95/P99 metrics

### 4. Capacity Planning
- Monitor resource trends
- Plan upgrades before hitting limits
- Track growth patterns

## Troubleshooting

### Dashboard Not Loading

1. Check API endpoint is accessible:
   ```bash
   curl http://localhost:3000/api/performance/metrics
   ```

2. Verify Supabase connection
3. Check browser console for errors

### Missing Data

1. Verify database tables exist:
   - `conversation_logs`
   - `embedded_documents`
   - `curated_knowledge`
   - `performance_metrics`

2. Check Supabase credentials in `.env.local`

### High Staleness Values

1. Check data ingestion pipelines
2. Verify crawlers are running
3. Review upload processes

### Poor Performance

1. Review query metrics for slow operations
2. Check system resources for bottlenecks
3. Analyze API endpoint latencies
4. Review cache hit rates

## Future Enhancements

- [ ] Real-time alerts via email/Slack
- [ ] Historical data export
- [ ] Comparison with previous periods
- [ ] Predictive analytics
- [ ] Custom metric dashboards
- [ ] Integration with external monitoring (Grafana, Datadog)
- [ ] Anomaly detection
- [ ] Performance budgets and SLAs

## Related Documentation

- [Testing Fundamentals](./TESTING_FUNDAMENTALS.md)
- [AOMA Integration](./AOMA-DOCUMENTATION-INDEX.md)
- [Production Testing](./PRODUCTION_TESTING.md)

---

**Last Updated**: October 22, 2025
**Version**: 1.0.0
