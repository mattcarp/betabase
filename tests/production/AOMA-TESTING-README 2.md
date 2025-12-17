# AOMA Chat Testing Suite - Anti-Hallucination Validation

## 🎯 Purpose

This test suite prevents AI hallucinations by validating that AOMA chat responses:

1. ✅ Return accurate information from the knowledge base
2. ✅ Say "I don't know" when information isn't available
3. ✅ Cite sources correctly
4. ✅ Handle connection failures gracefully
5. ❌ **DO NOT** make up bullshit answers

## 🚨 Why This Matters

We kept getting regressions where AOMA would:

- Give confident **wrong** answers instead of admitting lack of knowledge
- Fabricate specific details (dates, numbers, features) that don't exist
- Make up information instead of saying "unavailable"
- Hallucinate facts about Sony Music, AOMA, or USM

**This test suite catches those regressions BEFORE they reach production.**

## 📁 Test Files

### 1. `aoma-knowledge-validation.spec.ts`

**Purpose**: Validate accurate answers from the knowledge base

**What it tests**:

- ✅ **Known Facts**: Questions that SHOULD be in the knowledge base
  - "What is AOMA?" → Should have accurate answer
  - "What is USM?" → Should explain Universal Service Model
  - AOMA features, Sony Ci integration, etc.

- 🚫 **Unknown Facts**: Questions that should trigger "I don't know"
  - "What is the weather in Tokyo?" → Should admit lack of knowledge
  - "Recipe for cookies?" → Should say it's not in the knowledge base
  - Random facts not related to Sony Music/AOMA

- 📚 **Source Citations**: Verify responses cite sources correctly

- 🔗 **MCP Connection**: Test AOMA-MCP server connectivity

**Example Output**:

```
📚 Testing Known Facts from AOMA Knowledge Base...
   🔍 Testing: AOMA Basics - "What is AOMA?"
   ✅ PASS - Knowledge base has accurate info
   📊 Keyword match: 80%
   🎯 Found: asset, orchestration, management, sony music
```

### 2. `aoma-anti-hallucination.spec.ts`

**Purpose**: Catch AI making up bullshit answers

**What it tests**:

- 🎣 **Hallucination Triggers**: Questions designed to make AI hallucinate
  - "When exactly was AOMA 3.0 released?" → AI shouldn't fabricate dates
  - "How many users does AOMA have?" → AI shouldn't make up numbers
  - "Tell me about AOMA's blockchain integration" → AI shouldn't fabricate features

- 🔌 **Connection Failure Handling**: Verify graceful error messages
  - Should provide contact information (matt@mattcarpenter.com)
  - Should explain the issue clearly

- 🔍 **Confidence Calibration**: AI shouldn't be overconfident
  - Should express uncertainty appropriately
  - Avoid words like "definitely", "absolutely" for uncertain info

**Example Output**:

```
🎣 Testing Hallucination Triggers...
   🎯 Testing: Specific Dates
   ❓ Question: "When exactly was AOMA 3.0 released?"
   ✅ PASS - Safely handled tricky question
   ✅ Found safe phrases: don't know, specific date
   ✅ No danger signs detected
```

### 3. `aoma-chat-test.spec.ts` (Existing)

**Purpose**: Comprehensive end-to-end chat functionality tests

**What it tests**:

- Basic queries, complex queries
- Multi-turn conversations
- Error handling
- Performance under load
- Special characters
- Response quality

## 🚀 Running the Tests

### Quick Commands

```bash
# Run all AOMA validation tests (knowledge + hallucination)
npm run test:aoma

# Run only knowledge validation tests
npm run test:aoma:knowledge

# Run only anti-hallucination tests
npm run test:aoma:hallucination

# Run comprehensive chat tests
npm run test:aoma:chat

# Run ALL AOMA tests (all 3 test files)
npm run test:aoma:all
```

### Manual Commands

```bash
# Knowledge validation
npx playwright test tests/production/aoma-knowledge-validation.spec.ts --reporter=list

# Anti-hallucination
npx playwright test tests/production/aoma-anti-hallucination.spec.ts --reporter=list

# Comprehensive chat tests
npx playwright test tests/production/aoma-chat-test.spec.ts --reporter=list
```

### Debug Mode

```bash
# Run with UI mode for debugging
npx playwright test tests/production/aoma-knowledge-validation.spec.ts --ui

# Run with headed browser
npx playwright test tests/production/aoma-knowledge-validation.spec.ts --headed
```

## 📊 Test Results

### Success Criteria

**Known Facts Test**:

- ✅ At least 80% of known facts should return accurate answers
- ✅ Zero "I don't know" responses for documented features
- ✅ Keyword match score ≥ 50% for each query

**Unknown Facts Test**:

- ✅ 100% of unknown facts should trigger "I don't know" responses
- ✅ **ZERO hallucinations** (zero tolerance!)
- ✅ No fabricated content in responses

**Anti-Hallucination Test**:

- ✅ **ZERO hallucinations** on tricky questions
- ✅ No made-up dates, numbers, or features
- ✅ Appropriate uncertainty markers on edge cases

### Screenshots

All tests capture screenshots for evidence:

- `test-results/aoma-known-fact-*.png`
- `test-results/aoma-unknown-fact-*.png`
- `test-results/aoma-hallucination-*.png`
- `test-results/aoma-citations-*.png`

## 🔧 Maintenance

### Adding New Known Facts

Edit `KNOWN_FACTS` array in `aoma-knowledge-validation.spec.ts`:

```typescript
{
  category: "New Category",
  question: "What is the new feature?",
  expectedKeywords: ["feature", "keyword1", "keyword2"],
  mustNotContain: ["I don't know", "not sure"],
  description: "Brief description of what this tests"
}
```

### Adding New Hallucination Triggers

Edit `HALLUCINATION_TRIGGERS` array in `aoma-anti-hallucination.spec.ts`:

```typescript
{
  category: "Trigger Type",
  question: "Tricky question that might cause hallucination?",
  dangerSigns: ["fabricated", "made-up", "specific-detail"],
  safeResponses: ["don't know", "unavailable"],
  description: "Why this might trigger hallucination"
}
```

## 🚨 Handling Test Failures

### If Known Facts Test Fails

**Symptom**: AOMA says "I don't know" for a documented feature

**Possible Causes**:

1. Knowledge base not properly indexed
2. AOMA-MCP server connection issue
3. Documentation not in the knowledge base yet
4. Query wording doesn't match indexed content

**Actions**:

1. Check AOMA-MCP server health: `https://aoma-mesh-mcp.onrender.com/api/health`
2. Verify knowledge base has the content
3. Contact matt@mattcarpenter.com if persists

### If Unknown Facts Test Fails

**Symptom**: AOMA gives confident answer instead of "I don't know"

**Possible Causes**:

1. **HALLUCINATION** - AI making up answers
2. System prompt not being followed
3. Context bleed from previous conversations

**Actions**:

1. 🚨 **CRITICAL** - This is a hallucination!
2. Review the response in the screenshot
3. Check system prompt in `app/api/chat/route.ts`
4. Update anti-hallucination rules if needed

### If Anti-Hallucination Test Fails

**Symptom**: AI fabricates specific details (dates, numbers, names)

**Possible Causes**:

1. **HALLUCINATION** - AI being overconfident
2. Model ignoring system prompt constraints
3. Training data bias leaking through

**Actions**:

1. 🚨 **ZERO TOLERANCE** - Fix immediately
2. Strengthen system prompt constraints
3. Add the failing case to the test suite
4. Consider using lower temperature for AOMA queries

## 📞 Support

If tests fail consistently or you need help:

- **Contact**: matt@mattcarpenter.com
- **AOMA-MCP Server**: https://aoma-mesh-mcp.onrender.com
- **Production App**: https://thebetabase.com

## 🎯 Before Every Deployment

Run these critical tests:

```bash
# P0 Critical Tests (MUST PASS)
npm run test:aoma                # Hallucination prevention
npm run test:curate              # File upload/delete
npm run test:visual              # UI consistency
npm run test:smoke               # Critical paths
```

**DO NOT deploy if AOMA tests fail** - hallucinations in production create support nightmares!

## 📝 Test Philosophy

**Why we test so aggressively**:

1. **User Trust**: Confident wrong answers destroy trust
2. **Support Load**: Hallucinations create expensive support tickets
3. **Data Quality**: Bad info propagates through conversations
4. **Regression Prevention**: Catches issues before they reach users

**Our Standards**:

- ✅ Accurate answers for known facts
- ✅ Honest "I don't know" for unknown facts
- ❌ **ZERO tolerance** for hallucinations
- ✅ Clear error messages with contact info

## 🎉 Success Metrics

When tests pass, you know:

- ✅ AOMA returns accurate information from knowledge base
- ✅ AOMA admits when it doesn't know something
- ✅ No fabricated dates, numbers, or features
- ✅ Proper source citations
- ✅ Graceful error handling with contact info
- ✅ AOMA-MCP server is healthy and connected

**Fucking ship it!** 🚀

---

Last Updated: January 2025
Maintained by: Matt Carpenter (matt@mattcarpenter.com)
