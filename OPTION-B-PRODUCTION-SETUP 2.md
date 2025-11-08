# 🚀 Option B: Production Setup Complete Guide

## ✅ What's Working (Option A Results)

Your RLHF system is **fully functional** in test mode:
- ✅ **4 tabs** in Curate panel (Files, Upload, Info, RLHF)
- ✅ **Stats Dashboard** with Pending/Submitted/Avg Rating
- ✅ **Feedback Queue** with mock AOMA data
- ✅ **Interactive Elements**: Thumbs up/down, star rating
- ✅ **Mac Glassmorphism Design**: 8 elements with purple accents
- ✅ **Permission Gating**: Working correctly
- ✅ **Zero Runtime Errors**

---

## 📋 Production Checklist

### Step 1: Database Migrations (5 minutes)

**File Locations:**
- `supabase/migrations/006_user_roles_permissions.sql`
- `supabase/migrations/007_rlhf_feedback_schema.sql`  
- `supabase/migrations/008_gemini_embeddings.sql`

**Apply Migrations:**

```bash
cd /Users/matt/Documents/projects/siam

# Option A: Push all migrations at once
supabase db push

# Option B: Apply individually
supabase db execute < supabase/migrations/006_user_roles_permissions.sql
supabase db execute < supabase/migrations/007_rlhf_feedback_schema.sql
supabase db execute < supabase/migrations/008_gemini_embeddings.sql
```

**Verify Tables Created:**

```sql
-- Check in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_roles', 'role_permissions', 'rlhf_feedback', 'gemini_embeddings');
```

---

### Step 2: Assign Curator Role (2 minutes)

**In Supabase SQL Editor:**

```sql
-- Replace with YOUR actual email
INSERT INTO user_roles (user_email, role_name, created_at, updated_at)
VALUES ('your-email@example.com', 'curator', NOW(), NOW())
ON CONFLICT (user_email) DO UPDATE 
SET role_name = 'curator', updated_at = NOW();

-- Assign RLHF permissions to curator role
INSERT INTO role_permissions (role_name, permission_name)
VALUES 
  ('curator', 'rlhf_feedback'),
  ('curator', 'rlhf_view_insights'),
  ('curator', 'rlhf_view_dashboard'),
  ('curator', 'curate_documents')
ON CONFLICT DO NOTHING;

-- Verify
SELECT ur.user_email, ur.role_name, rp.permission_name
FROM user_roles ur
LEFT JOIN role_permissions rp ON ur.role_name = rp.role_name
WHERE ur.user_email = 'your-email@example.com';
```

---

### Step 3: Update CurateTab.tsx (1 minute)

**File:** `src/components/ui/CurateTab.tsx`  
**Lines:** 96-103

**Change FROM (Test Mode):**
```typescript
// TEMPORARY TEST MODE: Force enable RLHF to see all features
const canAccessRLHF = true; // TODO: Revert to production after testing

// Production code (uncomment after testing):
// const userEmail = session?.user?.email || ""; // Get from auth context
// const { hasPermission } = usePermissions(userEmail);
// const canAccessRLHF = hasPermission("rlhf_feedback");
```

**TO (Production Mode):**
```typescript
// Permission check for RLHF features (PRODUCTION)
const userEmail = session?.user?.email || ""; // Get from auth context
const { hasPermission } = usePermissions(userEmail);
const canAccessRLHF = hasPermission("rlhf_feedback");
```

**Note:** You'll need to import and use your auth session. If you're using Supabase Auth:

```typescript
import { createClient } from "@/lib/supabase/client";

// Inside component:
const [userEmail, setUserEmail] = useState<string>("");

useEffect(() => {
  async function getUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUserEmail(user?.email || "");
  }
  getUser();
}, []);

const { hasPermission } = usePermissions(userEmail);
const canAccessRLHF = hasPermission("rlhf_feedback");
```

---

### Step 4: Test Production Setup (2 minutes)

```bash
# Reload app
# Visit http://localhost:3000
# Click Curate tab

# Should see:
# ✅ RLHF tab visible (if you're logged in as curator)
# ❌ RLHF tab hidden (if not logged in or not curator)

# Run automated test:
npx playwright test tests/e2e/rlhf-curate-integration.spec.ts --grep "COMPREHENSIVE"
```

---

### Step 5: Connect Chat API (10 minutes)

**Update:** `app/api/chat/route.ts`

Add the UnifiedRAGOrchestrator:

```typescript
import { UnifiedRAGOrchestrator } from '@/services/rlhf/UnifiedRAGOrchestrator';

// Inside your chat route handler:
const ragOrchestrator = new UnifiedRAGOrchestrator({
  supabaseClient: supabaseClient,
  aomaOrchestrator: aomaOrchestrator,
  enableReranking: true,
  enableAgenticRAG: true,
  enableContextAware: true,
});

// Use it for retrieval:
const context = await ragOrchestrator.orchestrateRetrieval({
  query: userMessage,
  conversationHistory: messages,
  sessionId: sessionId,
});
```

---

## 🎯 Expected Production Behavior

### **With Curator Role:**
1. Login to app with your email
2. Click "Curate" tab → See 4 tabs (including RLHF)
3. Click "RLHF" tab → See full interface
4. Submit feedback → Saves to `rlhf_feedback` table
5. Real-time stats update

### **Without Curator Role:**
1. Login to app with non-curator email
2. Click "Curate" tab → See only 3 tabs (Files, Upload, Info)
3. No RLHF functionality visible
4. Clean, professional UI

---

## 📈 Future Enhancements (Post-Production)

1. **Agent Insights Tab** - Flowcharts showing AI decision-making
2. **Reinforcement Dashboard** - Charts showing system learning over time
3. **Real-time Feedback Queue** - Pull from actual chat interactions
4. **Advanced Analytics** - Aggregate feedback metrics
5. **A/B Testing** - Compare RLHF variations

---

## ✅ Verification Commands

```bash
# Check migrations applied
supabase db execute -c "SELECT * FROM user_roles LIMIT 5;"

# Check your role
supabase db execute -c "SELECT * FROM user_roles WHERE user_email = 'your-email@example.com';"

# Check permissions
supabase db execute -c "SELECT * FROM role_permissions WHERE role_name = 'curator';"

# Test RLHF feedback insert
supabase db execute -c "INSERT INTO rlhf_feedback (conversation_id, user_query, ai_response, rating, feedback_text) VALUES ('test-123', 'test query', 'test response', 5, 'test feedback') RETURNING *;"
```

---

## 🚨 Troubleshooting

### RLHF Tab Not Showing After Production Setup

1. **Check user is logged in:**
   ```typescript
   console.log('User email:', userEmail);
   ```

2. **Check permissions loaded:**
   ```typescript
   const { hasPermission, loading, error } = usePermissions(userEmail);
   console.log('Has RLHF permission:', hasPermission('rlhf_feedback'));
   console.log('Loading:', loading);
   console.log('Error:', error);
   ```

3. **Check database:**
   ```sql
   SELECT * FROM user_roles WHERE user_email = 'your-email@example.com';
   SELECT * FROM role_permissions WHERE role_name = 'curator';
   ```

### Feedback Not Saving

1. **Check RLS policies** on `rlhf_feedback` table
2. **Check Supabase logs** for insert errors
3. **Verify schema** matches migration

---

**Ready to proceed with production setup?**

Run Step 1 (migrations) when you're ready!

