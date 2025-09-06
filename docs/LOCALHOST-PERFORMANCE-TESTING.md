# Localhost Performance Testing Guide

## 🎯 Accurate Response Time Measurement

You CAN get production-accurate response times when testing on localhost because you're still hitting the same remote Railway-deployed aoma-mesh-mcp server that production uses.

## Setup for Accurate Testing

### 1. Configure to Use Production MCP Server

Edit your `.env.local` file:

```env
# Switch from local to production MCP mode
NEXT_PUBLIC_MCP_MODE=production

# Railway MCP Server (NOT AWS Lambda!)
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app
NEXT_PUBLIC_AOMA_MESH_RPC_URL=https://luminous-dedication-production.up.railway.app/rpc
NEXT_PUBLIC_AOMA_MESH_HEALTH_URL=https://luminous-dedication-production.up.railway.app/health

# Enable performance timing
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_METRICS=true
```

### 2. Add Performance Timing to Chat

Create or update `src/utils/performance.ts`:

```typescript
export class ChatPerformanceMonitor {
  private startTime: number = 0;
  private firstTokenTime: number = 0;
  private endTime: number = 0;

  startRequest() {
    this.startTime = performance.now();
    console.log('🏁 Chat request started');
  }

  recordFirstToken() {
    this.firstTokenTime = performance.now();
    const ttft = this.firstTokenTime - this.startTime;
    console.log(`⚡ Time to first token: ${ttft.toFixed(0)}ms`);
    return ttft;
  }

  endRequest() {
    this.endTime = performance.now();
    const total = this.endTime - this.startTime;
    console.log(`✅ Total response time: ${total.toFixed(0)}ms`);
    return {
      totalTime: total,
      timeToFirstToken: this.firstTokenTime - this.startTime,
      streamingTime: this.endTime - this.firstTokenTime
    };
  }
}
```

### 3. Integrate Timing in Chat Route

In `app/api/chat/route.ts`:

```typescript
import { ChatPerformanceMonitor } from '@/utils/performance';

export async function POST(req: Request) {
  const monitor = new ChatPerformanceMonitor();
  monitor.startRequest();

  try {
    // Your existing chat logic...
    const result = await streamText({
      model: openai(modelName),
      messages: convertToModelMessages(uiMessages),
      onStart: () => {
        monitor.recordFirstToken();
      }
    });

    return result.toUIMessageStreamResponse({
      onComplete: () => {
        const metrics = monitor.endRequest();
        // Log metrics or send to analytics
      }
    });
  } catch (error) {
    monitor.endRequest();
    throw error;
  }
}
```

### 4. Visual Performance Indicators

Add to your chat UI component:

```typescript
const [metrics, setMetrics] = useState({
  isLoading: false,
  startTime: 0,
  timeToFirstToken: 0,
  currentTime: 0
});

// Update in real-time
useEffect(() => {
  if (metrics.isLoading) {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        currentTime: performance.now() - prev.startTime
      }));
    }, 100);
    return () => clearInterval(interval);
  }
}, [metrics.isLoading]);

// Display in UI
{metrics.isLoading && (
  <div className="text-xs text-muted-foreground">
    Response time: {(metrics.currentTime / 1000).toFixed(1)}s
    {metrics.timeToFirstToken > 0 && (
      <span> | TTFT: {(metrics.timeToFirstToken / 1000).toFixed(1)}s</span>
    )}
  </div>
)}
```

## 📊 Expected Performance Benchmarks

When testing localhost → Railway MCP:

| Metric | Expected Time | Notes |
|--------|--------------|-------|
| Time to First Token | 800-1500ms | Includes Railway cold start if needed |
| Simple Query (math, greetings) | 1-2s total | Should bypass AOMA orchestration |
| Complex Query (AOMA knowledge) | 2-4s total | Full orchestration pipeline |
| Streaming Completion | +1-3s | Depends on response length |

## 🔍 Performance Debugging

### Check Railway Server Health

```bash
# Test Railway MCP server directly
curl -w "@-" -o /dev/null -s "https://luminous-dedication-production.up.railway.app/health" <<'EOF'
    time_namelookup:  %{time_namelookup}s\n
       time_connect:  %{time_connect}s\n
    time_appconnect:  %{time_appconnect}s\n
   time_pretransfer:  %{time_pretransfer}s\n
      time_redirect:  %{time_redirect}s\n
 time_starttransfer:  %{time_starttransfer}s\n
                    ----------\n
         time_total:  %{time_total}s\n
EOF
```

### Browser DevTools Analysis

1. Open Network tab
2. Filter by `luminous-dedication` to see Railway requests
3. Check Timing tab for detailed breakdown:
   - DNS Lookup
   - Initial connection
   - SSL negotiation
   - Request sent
   - Waiting (TTFB)
   - Content download

### Console Logging

Enable detailed logging in browser console:

```javascript
localStorage.setItem('debug', 'chat:*');
```

## ⚡ Performance Optimization Tips

1. **Ensure Railway server is warm**: First request may be slower due to cold start
2. **Use production build locally**: `npm run build && npm start`
3. **Disable React DevTools**: They add overhead in development mode
4. **Test with consistent network**: Use ethernet if possible
5. **Clear browser cache**: Ensure fresh connections

## 🚨 Common Issues

### Issue: Getting local timeouts instead of Railway responses

**Fix**: Ensure `NEXT_PUBLIC_MCP_MODE=production` in `.env.local`

### Issue: CORS errors when hitting Railway

**Fix**: Railway server should have proper CORS headers configured

### Issue: Much slower than production

**Fix**: Check if you're accidentally using `NEXT_PUBLIC_MCP_MODE=local`

## Summary

Testing on localhost with Railway MCP server provides:
- **Accurate backend performance**: Same server, same latency
- **Isolated frontend testing**: No deployment variables
- **Real-world API timings**: Actual network round-trips
- **Better debugging**: Local console and DevTools access

Remember: We use **Railway** for aoma-mesh-mcp deployment, NOT AWS Lambda!