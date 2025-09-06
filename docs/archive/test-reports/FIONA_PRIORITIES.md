# FIONA PRIORITY TASK SYSTEM

# Generated from the Fiona agent requirements

# EVERYTHING MUST PASS THROUGH FIONA'S ACCEPTANCE CRITERIA

## 🚨 CRITICAL PATH TO DELIVERY (Week 1 - THIS WEEK)

### PRIORITY 0: Authentication (BLOCKING EVERYTHING)

- [ ] FIX: Magic link for fiona.burgess.ext@sonymusic.com
- [ ] FIX: Magic link for fiona@fionaburgess.com
- [ ] TEST: Both emails can log in without friction
- [ ] TEST: Session persists across browser restarts
- [ ] FIONA ACCEPTS: "I can actually log in with both my emails"

### PRIORITY 1: Chat Landing Page (CORE FUNCTIONALITY)

- [ ] FIX: Land directly on chat after login (not dashboard)
- [ ] FIX: Langchain orchestration for complex AOMA queries
- [ ] FIX: Connect all mined agents for knowledge synthesis
- [ ] TEST: Answer quality appropriate for 10+ years expertise
- [ ] FIONA ACCEPTS: "This actually helps with my daily support work"

### PRIORITY 2: Document Upload (IMMEDIATE NEED)

- [ ] FIX: Upload to Assistant ID ending in 2nfM
- [ ] FIX: Documents available in langchain immediately
- [ ] FIX: Visual confirmation of successful upload
- [ ] FIX: Support PDF, DOCX, images
- [ ] TEST: Upload document and query its contents
- [ ] FIONA ACCEPTS: "I can upload and immediately use documents"

## ⚠️ MUST HAVE (Week 2)

### PRIORITY 3: Knowledge Curation Tab

- [ ] IMPLEMENT: View all uploaded documents
- [ ] IMPLEMENT: Add/delete documents with feedback
- [ ] IMPLEMENT: Correct wrong AI answers mechanism
- [ ] IMPLEMENT: Audit trail of corrections
- [ ] FIONA ACCEPTS: "I can fix wrong answers without calling Matt"

### PRIORITY 4: Test Management Tab

- [ ] DESIGN: Test suite management interface
- [ ] IMPLEMENT: Test execution history
- [ ] IMPLEMENT: User workflow coverage metrics
- [ ] FIONA ACCEPTS: "I can see what's actually broken"

### PRIORITY 5: Settings Menu

- [ ] IMPLEMENT: Upper-right settings dropdown
- [ ] ADD: Langsmith settings access
- [ ] ADD: System health indicators
- [ ] ADD: User-friendly admin controls
- [ ] FIONA ACCEPTS: "I can manage this myself"

## 📋 FIONA'S ACCEPTANCE CHECKLIST

Every feature must pass ALL of these:

1. ✓ Can Fiona use this for daily work?
2. ✓ Will it work at 3 PM on a busy Tuesday?
3. ✓ Is it better than her current workflow?
4. ✓ Would she recommend it to other engineers?

## 🎯 WINDSURF TASK CONFIGURATION

\`\`\`json
{
"windsurf.tasks.fiona": {
"priority": "CRITICAL",
"filter": "fiona-acceptance",
"owner": "matt",
"deadline": "THIS_WEEK",
"validation": {
"agent": "fiona",
"criteria": [
"actually_works",
"production_ready",
"user_tested"
]
}
}
}
\`\`\`

## 💡 FIONA TASK COMMANDS FOR WINDSURF

### Quick Commands:

- `@fiona validate` - Run acceptance criteria
- `@fiona priority` - Show what to work on NOW
- `@fiona test [feature]` - Test as actual user
- `@fiona ship` - Is this ready for Fiona?

### Integration Points:

1. Before ANY commit: "Would Fiona accept this?"
2. Before ANY PR: "Does this solve Fiona's problem?"
3. Before ANY deploy: "Can Fiona use this tomorrow?"

## 🔥 CURRENT BLOCKERS (FIX IMMEDIATELY)

1. Magic link authentication broken for both emails
2. Curate tab exists but is EMPTY
3. Document upload has silent failures
4. Chat doesn't reflect senior expertise level

## 📊 SUCCESS METRICS

- Days since promise: 365+ (UNACCEPTABLE)
- Features Fiona can use: 0/6 (CRITICAL)
- Features half-built: 6/6 (PROBLEM)
- Fiona satisfaction: WAITING

---

REMEMBER: Every line of code should answer "YES" to:
"Will this help Fiona do her job tomorrow?"
