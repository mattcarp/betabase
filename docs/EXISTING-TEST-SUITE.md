# Existing Test Suite Integration

## Overview

SIAM has **10,000+ hand-written test cases** stored in the database. These tests were created several years ago and represent valuable domain knowledge about expected system behavior, particularly around IOMA/AOMA integration and knowledge base functionality.

## Historical Context

These tests were developed during the initial implementation phases of the Sony Music knowledge management system. They capture:

- **Business Rules**: Expected behavior for AOMA data access patterns
- **Edge Cases**: Unusual scenarios that caused issues in production
- **Domain Knowledge**: Specific terminology and data structures used in Sony Music systems
- **Regression Coverage**: Known bugs and their expected fixes

## Database Schema (To Be Identified)

**⚠️ Action Required:** We need to identify the exact table name and schema structure.

Expected structure likely includes:
- `test_id` - Unique identifier
- `test_description` - Human-readable test description
- `input_query` - The query or input being tested
- `expected_output` - Expected result
- `test_category` - Category (e.g., 'aoma-search', 'knowledge-retrieval', 'metadata-validation')
- `creation_date` - When the test was written
- `last_run_date` - Most recent execution
- `pass_fail_history` - Historical test results
- `priority` - Importance level
- `tags` - Categorization tags

## Integration Strategy

### 1. Historical Test Augmentation

Use existing tests to augment new RLHF-generated tests:

- **Pattern Extraction**: Analyze historical tests to identify common query patterns
- **Coverage Gap Analysis**: Find areas not covered by historical tests
- **Duplication Prevention**: Ensure new RLHF tests don't duplicate historical ones
- **Golden Set Validation**: Use historical tests as regression baseline

### 2. Test Revival & Modernization

- **Relevance Review**: Assess which old tests are still relevant
- **System Updates**: Update tests to match current system architecture
- **Playwright Conversion**: Convert to modern Playwright format
- **RLHF Tagging**: Categorize with RLHF feedback categories

### 3. RLHF-Historical Comparison

- **Pattern Analysis**: Compare RLHF feedback with historical test failures
- **Recurring Issues**: Identify problems that persist across years
- **Predictive Modeling**: Use historical data to predict failure modes
- **Knowledge Transfer**: Extract learnings from old tests into new RLHF system

## Access Methods

### Query Historical Tests

```typescript
// Find all historical tests
const { data: allTests } = await supabase
  .from('historical_tests') // TBD: actual table name
  .select('*')
  .order('creation_date', { ascending: false });

// Query by category
const { data: aomaTests } = await supabase
  .from('historical_tests')
  .select('*')
  .eq('test_category', 'aoma-search')
  .limit(100);

// Find tests related to current query
async function findSimilarHistoricalTests(query: string, limit = 10) {
  // Use vector similarity or text search
  const { data } = await supabase.rpc('search_historical_tests', {
    search_query: query,
    match_count: limit
  });
  
  return data;
}
```

### Augment New Tests with Historical Context

```typescript
async function augmentTestWithHistoricalContext(
  newTest: TestCase,
  historicalTests: HistoricalTest[]
) {
  // Find similar historical tests
  const similar = historicalTests.filter(ht => 
    calculateSimilarity(ht.input_query, newTest.query) > 0.7
  );
  
  // Extract patterns
  const patterns = similar.map(ht => ({
    query: ht.input_query,
    expected: ht.expected_output,
    category: ht.test_category,
    passRate: ht.pass_fail_history?.passRate || 0
  }));
  
  // Enrich new test
  return {
    ...newTest,
    historicalContext: {
      similarTests: patterns,
      recommendations: generateRecommendations(patterns),
      knownIssues: extractKnownIssues(patterns)
    }
  };
}
```

### Integration with RLHF Feedback

```typescript
async function linkHistoricalTestToRLHF(
  historicalTestId: string,
  feedbackItemId: string
) {
  // Create bidirectional link
  await supabase.from('test_feedback_links').insert({
    historical_test_id: historicalTestId,
    rlhf_feedback_id: feedbackItemId,
    link_reason: 'similar_query_pattern',
    created_at: new Date().toISOString()
  });
  
  // Update test metadata
  await supabase.from('historical_tests')
    .update({
      rlhf_linked: true,
      last_updated: new Date().toISOString()
    })
    .eq('test_id', historicalTestId);
}
```

## Test Categories (Estimated)

Based on SIAM's domain, historical tests likely cover:

1. **AOMA Search & Retrieval** (~3,000 tests)
   - Document search accuracy
   - Metadata filtering
   - Multi-tenant data isolation

2. **Knowledge Base Queries** (~2,500 tests)
   - Vector search precision
   - Context understanding
   - Source attribution

3. **Integration Testing** (~2,000 tests)
   - API endpoints
   - Authentication flows
   - Error handling

4. **Business Logic** (~1,500 tests)
   - Permission checks
   - Data validation
   - Workflow processes

5. **Edge Cases & Regressions** (~1,000 tests)
   - Known bugs
   - Boundary conditions
   - Error scenarios

## Implementation Priorities

### Phase 1: Discovery (Complete First)
- [ ] Identify exact table name for historical tests
- [ ] Document complete schema structure
- [ ] Create sample query scripts
- [ ] Analyze test distribution by category

### Phase 2: UI Integration
- [ ] Build Historical Test Explorer component
- [ ] Add search and filter capabilities
- [ ] Link to RLHF feedback items
- [ ] Display in Test tab

### Phase 3: Test Augmentation
- [ ] Implement similarity search for relevant historical tests
- [ ] Auto-suggest historical context for new RLHF tests
- [ ] Create conversion tools (historical → Playwright)
- [ ] Build comparison dashboard

### Phase 4: Modernization
- [ ] Mark obsolete tests
- [ ] Convert high-value tests to Playwright
- [ ] Update for current system architecture
- [ ] Tag with RLHF categories

## Benefits of Integration

1. **Knowledge Preservation**: Don't lose 10k hours of testing work
2. **Pattern Recognition**: Learn from past successes and failures
3. **Coverage Analysis**: Identify gaps in current testing
4. **Baseline Comparison**: Measure RLHF improvements against historical baseline
5. **Domain Expertise**: Leverage years of accumulated knowledge

## Next Steps

1. **IMMEDIATE**: Query Supabase schema to find test table name
2. Run sample queries to understand data structure
3. Build Historical Test Explorer component for Test tab
4. Create linking mechanism between historical tests and RLHF feedback
5. Document migration path for converting old tests to new format

## Related Documentation

- [RLHF Workflow](./RLHF-WORKFLOW.md) - How RLHF feedback is collected
- [Advanced RAG Architecture](./ADVANCED-RAG-ARCHITECTURE.md) - System architecture
- [Test Dashboard Guide](./TEST-DASHBOARD-GUIDE.md) - How to use the Test tab

---

*Last Updated: [Current Date]*  
*Status: Documentation complete, implementation pending table identification*

