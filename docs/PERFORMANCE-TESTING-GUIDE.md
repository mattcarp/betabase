# Performance Testing Guide for SIAM Chat

**Created**: November 2, 2025  
**Purpose**: Comprehensive performance testing for chat response times

---

## 🚀 **Quick Start**

### Run All Performance Tests

```bash
npm run test:performance
```

This will:
1. ✅ Run Web Vitals analysis
2. ✅ Measure chat response times (cold start, warm cache, multiple queries)
3. ✅ Analyze AOMA orchestration bottleneck
4. ✅ Detect long tasks (main thread blocking)
5. ✅ Check for memory leaks
6. ✅ Generate comprehensive reports

### Run Specific Tests

```bash
# Quick chat response time test only
npm run test:performance:quick

# Web Vitals only
npm run test:performance:vitals

# Individual test files
npx playwright test tests/performance/chat-response-time.spec.ts
npx playwright test tests/performance/web-vitals-chat.spec.ts
npx playwright test tests/performance/comprehensive-performance.spec.ts
```

### Integrated with All Tests

Performance tests now run automatically when you execute:

```bash
npm run test:all
```

---

## 📊 **What Gets Tested**

### 1. Chat Response Times

**File**: `tests/performance/chat-response-time.spec.ts`

**Measures**:
- ⏱️ **TTFB (Time to First Byte)**: How long before streaming starts (AOMA orchestration time)
- ⏱️ **TTFR (Time to First Render)**: When user sees first response
- ⏱️ **Total Response Time**: Complete response time
- 🔥 **Cold Start**: First query (no cache) - Should be <3000ms
- 🟢 **Warm Cache**: Repeated query - Should be <1000ms
- 📈 **Multiple Queries**: Different queries - Consistency check

**Key Metrics**:
```
Target Performance:
- Cold Start TTFB: <2000ms
- Warm Cache TTFB: <600ms
- Typical TTFB: <1000ms
```

**What It Tells You**:
- Is embedding cache working? (6x speedup when working)
- Is Supabase index optimized? (<200ms target)
- Are there regressions in AOMA orchestration?

### 2. Web Vitals

**File**: `tests/performance/web-vitals-chat.spec.ts`

**Measures**:
- 🎨 **LCP (Largest Contentful Paint)**: Visual loading performance - Target: <2500ms
- 🎯 **FCP (First Contentful Paint)**: Initial render - Target: <1800ms
- 📐 **CLS (Cumulative Layout Shift)**: Visual stability - Target: <0.1
- ⚡ **TTFB (Time to First Byte)**: Server response time - Target: <800ms
- 🧠 **INP (Interaction to Next Paint)**: Responsiveness - Target: <200ms

**Additional Checks**:
- 🐌 **Long Tasks**: Main thread blocking (should be <500ms)
- 💾 **Memory Usage**: Leak detection
- 📦 **Resource Loading**: Bundle size and load times

**What It Tells You**:
- Is the UI performant?
- Are there layout shifts causing bad UX?
- Is the main thread blocked?
- Are there memory leaks?

### 3. Comprehensive Performance

**File**: `tests/performance/comprehensive-performance.spec.ts`

**Measures**:
- All of the above PLUS:
- Network performance
- Resource timing
- Page load metrics
- End-to-end user experience

---

## 📈 **Understanding Results**

### Example Output

```
📊 CHAT PERFORMANCE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Tests Completed: 3
✅ Successful: 3
❌ Failed: 0

⏱️  RESPONSE TIMES (Average)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TTFB (AOMA Orchestration):  1250ms   ⚠️  SLOW
   TTFR (First Visible):        1650ms
   Total Response Time:         5234ms

🎯 BOTTLENECK ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ⚠️  PRIMARY BOTTLENECK: AOMA Orchestration (1250ms)
   
   This happens BEFORE streaming starts, blocking the response.
   
   Expected breakdown:
   - Embedding generation: ~858ms (68%)
   - Vector search: ~392ms (32%)
   
   RECOMMENDATIONS:
   1. ✅ Enable embedding cache → Target: 325ms (6x faster)
   2. ✅ Optimize Supabase HNSW index → Target: 150ms
   3. ✅ Pre-filter by source_type before search
   4. ⚠️  Consider moving to background/parallel processing
```

### Interpreting Metrics

#### ✅ GOOD Performance
```
TTFB: <600ms
TTFR: <1000ms
Total: <5000ms
LCP: <2500ms
CLS: <0.1
```

#### ⚠️ NEEDS IMPROVEMENT
```
TTFB: 600-1500ms
TTFR: 1000-2000ms
Total: 5000-10000ms
LCP: 2500-4000ms
CLS: 0.1-0.25
```

#### ❌ POOR Performance
```
TTFB: >1500ms
TTFR: >2000ms
Total: >10000ms
LCP: >4000ms
CLS: >0.25
```

---

## 🔍 **Debugging Slow Performance**

### Step 1: Identify the Bottleneck

Run performance tests and look at the output:

```bash
npm run test:performance:quick
```

### Step 2: Check Specific Components

#### If TTFB is slow (>1500ms):
1. **Check embedding cache**:
   - First query should be slower (cold start)
   - Subsequent identical queries should be much faster (warm cache)
   - If all queries are slow, cache is not working

2. **Check Supabase index**:
   ```sql
   -- In Supabase SQL editor
   EXPLAIN ANALYZE 
   SELECT * FROM match_aoma_vectors(
     '[0.1, 0.2, ...]'::vector,
     0.25,
     10,
     ARRAY['firecrawl', 'knowledge']
   );
   ```
   - Should use HNSW index, not sequential scan
   - Should be <200ms

3. **Check server logs**:
   ```bash
   # Look for performance logs in dev server
   grep "PERFORMANCE" .next/server.log
   ```

#### If LCP is slow (>2500ms):
1. Check for large resources (images, JS bundles)
2. Look for render-blocking resources
3. Check for layout shifts (CLS)

#### If memory is growing:
1. Check for event listeners not being cleaned up
2. Look for circular references
3. Check React component re-renders

### Step 3: Apply Fixes

See `docs/PERFORMANCE-BOTTLENECK-ANALYSIS.md` for detailed optimization strategies.

---

## 📁 **Reports Location**

All performance reports are saved to:

```
tests/performance/reports/
├── chat-performance-YYYY-MM-DDTHH-mm-ss.json
├── web-vitals-YYYY-MM-DDTHH-mm-ss.json
└── comprehensive-YYYY-MM-DDTHH-mm-ss.json
```

### View Reports

```bash
# Latest chat performance report
cat $(ls -t tests/performance/reports/chat-performance-*.json | head -n 1) | jq .

# Latest Web Vitals report
cat $(ls -t tests/performance/reports/web-vitals-*.json | head -n 1) | jq .

# Summary only
cat $(ls -t tests/performance/reports/chat-performance-*.json | head -n 1) | jq .summary
```

---

## 🎯 **Performance Targets**

### Current Performance (Measured)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **TTFB (Cold Start)** | 2698ms | <1500ms | ❌ Needs improvement |
| **TTFB (Typical)** | 1250ms | <600ms | ⚠️ Needs improvement |
| **TTFB (Warm Cache)** | 545ms | <300ms | ⚠️ Close to target |
| **LCP** | <2500ms | <2500ms | ✅ Good |
| **FCP** | <1800ms | <1800ms | ✅ Good |
| **CLS** | <0.1 | <0.1 | ✅ Good |

### Optimization Priority

1. **🔥 High Priority**: Enable embedding cache (2.3x improvement)
2. **🔥 High Priority**: Optimize Supabase index (1.5x improvement)
3. **🟡 Medium Priority**: Pre-filter by source_type
4. **🟢 Low Priority**: Parallel processing (architectural change)

---

## 🚨 **CI/CD Integration**

Performance tests will fail if:
- TTFB > 3000ms (cold start acceptable up to 3s)
- TTFB > 1500ms (typical queries should be faster)
- LCP > 2500ms
- CLS > 0.1
- Long tasks > 500ms

This ensures performance doesn't regress over time.

---

## 📚 **Additional Resources**

- 📖 [Performance Bottleneck Analysis](./PERFORMANCE-BOTTLENECK-ANALYSIS.md) - Detailed analysis of current bottlenecks
- 📖 [Performance Optimization Summary](./PERFORMANCE-OPTIMIZATION-SUMMARY.md) - Historical optimization efforts
- 📖 [Web Vitals Documentation](https://web.dev/vitals/) - Google's Core Web Vitals guide

---

## 🆘 **Troubleshooting**

### Tests Won't Run

**Problem**: `Error: Browser not found`

**Solution**:
```bash
npx playwright install
```

### Tests Timeout

**Problem**: Tests timeout after 30s

**Solution**:
1. Check dev server is running: `curl http://localhost:3000`
2. Check AOMA orchestrator is responding
3. Check Supabase is accessible

### Inconsistent Results

**Problem**: Tests show different results each time

**Solution**:
1. Clear browser cache between runs
2. Restart dev server
3. Check for other processes using port 3000

---

## 💡 **Tips**

1. **Run tests multiple times**: First run may have cold starts
2. **Monitor trends**: Use reports to track performance over time
3. **Test in production**: Run tests against staging/production too
4. **Profile in Chrome**: Use Chrome DevTools for deep analysis
5. **Check network**: Performance can vary with network conditions

---

**Last Updated**: November 2, 2025  
**Maintained By**: SIAM Development Team  
**Questions?** Contact matt@mattcarpenter.com



