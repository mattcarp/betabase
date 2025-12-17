# RLHF End-to-End Loop Demo Script

> **Purpose**: Walk through the complete RLHF improvement loop in The Betabase
> **Duration**: ~5-7 minutes
> **Created**: 2025-12-16
> **Data**: Uses synthetic demo data (clearly marked in database)

---

## Pre-Demo Setup

### 1. Seed Demo Data
Run the SQL seed script in Supabase:
```bash
# In Supabase SQL Editor, run:
supabase/migrations/seed_rlhf_demo_data.sql
```

### 2. Verify Dev Server
```bash
cd /Users/matt/Documents/projects/mc-thebetabase
npx kill-port 3000
pnpm dev
```

### 3. Open Browser
Navigate to: `http://localhost:3000`

---

## Demo Flow

### Part 1: The Problem - Bad Response (Fix Tab → Response Debugger)

**Narrative**: "Let me show you how human feedback improves the AI. First, let's look at a response that went wrong."

1. Click **Fix** tab in the top navigation
2. You're now in **Response Debugger** sub-tab
3. Click the **dropdown arrow** next to the search field
4. Select the first item: **"What is the AOMA release process?"** (red thumbs down)
   - ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
5. Observe:
   - **Query**: "What is the AOMA release process?"
   - **Strategy**: context-aware RAG
   - **Confidence**: 45% (low!)
   - **Retrieved Docs**: 2 documents
   - **Thumbs Down**: User flagged this as wrong

**Point out**: 
- "This response incorrectly says to push directly to production"
- "The confidence was low at 45%, suggesting the system wasn't sure"
- "A user gave it thumbs down and marked it as critical"

---

### Part 2: The Fix - Curator Correction (Quick Fix Tab)

**Narrative**: "Now watch how a curator corrects this for future training."

1. Click the **Quick Fix** sub-tab
2. Click the **dropdown** to see responses needing correction
3. Select the same **AOMA release process** query
4. Observe:
   - **Original Query** shown at top
   - **Original Response** (incorrect) on left
   - **Corrected Response** area on right

5. **Make the correction** (type or paste):
```
The AOMA release process involves multiple stages:
1. Local development with unit tests
2. PR review and automated CI checks
3. Deployment to staging environment
4. QA verification on staging
5. Product owner approval
6. Production deployment with rollback plan

All changes must pass through staging before production. Direct pushes to production are not allowed.
```

6. Click **"Save as Training Example"**
7. Note the success toast: "Correction saved as training example!"

**Point out**:
- "The curator's correction is now stored with a 5-star rating"
- "This becomes high-quality training data"
- "Future similar queries will reference this correction"

---

### Part 3: The Test - Regression Test Generation (Test Generator Tab)

**Narrative**: "Now let's generate an automated test to ensure this never regresses."

1. Click the **Test Generator** sub-tab
2. Click the **dropdown** to see approved/corrected items
3. Select the **file size limits** query (this one is marked "approved" and has a correction)
   - ID: `d4e5f6a7-b8c9-0123-defa-456789012345`
4. Click **"Generate Playwright Test"**
5. Observe the generated test code:
   - Uses Playwright test framework
   - Queries the chat interface
   - Validates response contains correct information
   - Checks for RAG badges
6. Click **"Download"** to save the test file

**Point out**:
- "This test will run in CI/CD pipelines"
- "If someone changes the system and breaks this query, the test fails"
- "Human feedback turns into automated quality assurance"

---

### Part 4: The Timeline - Tracking Improvement (Feedback Timeline Tab)

**Narrative**: "Finally, let's see the full history of our feedback loop."

1. Click the **Feedback Timeline** sub-tab
2. Observe the timeline showing:
   - All feedback events chronologically
   - Color coding: green (good), orange (needs work), cyan (corrected)
   - Stats at top: Total, Positive, Negative, Corrected

3. Click **"Needs Fix"** filter
   - Shows only items requiring attention

4. Click **"Corrected"** filter
   - Shows items that have been fixed

5. Click **"Approved"** filter
   - Shows items ready for training

**Point out**:
- "This gives curators a single view of all feedback"
- "You can track improvement over time"
- "Every correction feeds back into the AI"

---

### Part 5: Full Circle - Show the Improvement (Optional)

**Narrative**: "Now if we go back to Chat and ask the same question..."

1. Click **Chat** tab
2. Ask: "What is the AOMA release process?"
3. The response should now incorporate the correction
4. Point out the improved confidence and accuracy

**Note**: This step requires the RLHF signals to be integrated into the RAG pipeline. If not yet implemented, skip this part.

---

## Demo Data Reference

### Scenario IDs (for manual entry)

| Scenario | ID | Description |
|----------|----|----|
| Bad Response | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` | AOMA release process - incorrect |
| Good Response | `b2c3d4e5-f6a7-8901-bcde-f23456789012` | Catalog API auth - accurate |
| Partial Response | `c3d4e5f6-a7b8-9012-cdef-345678901234` | Error codes - incomplete |
| Corrected Response | `d4e5f6a7-b8c9-0123-defa-456789012345` | File size limits - corrected |
| Recent Needs Review | `e5f6a7b8-c9d0-1234-efab-567890123456` | Spotify integration - good |

### All Data is Marked Synthetic
- `session_id` starts with `SYNTHETIC-DEMO-`
- `feedback_metadata` contains `"synthetic": true`
- Can be cleaned up with: `DELETE FROM rlhf_feedback WHERE session_id LIKE 'SYNTHETIC-DEMO-%'`

---

## Key Messages to Emphasize

1. **Human-in-the-Loop**: Real humans review and correct AI responses
2. **Training Data Pipeline**: Corrections become training examples
3. **Automated QA**: Feedback generates regression tests
4. **Continuous Improvement**: The timeline shows the learning loop
5. **Multi-Tenant**: All data scoped to `sony-music` organization

---

## Troubleshooting

### "No items in dropdown"
- Run the seed SQL script in Supabase
- Check Supabase connection in `.env.local`

### "Loading spinner never stops"
- Check browser console for errors
- Verify Supabase URL and anon key

### "Correction doesn't save"
- Check RLS policies allow inserts
- Try with service role key temporarily

---

*Demo created by Claudette, 2025-12-16* 💜

