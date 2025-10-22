# SIAM Security Audit - Critical Findings

**Date**: 2025-10-10
**Auditor**: Fiona (Senior AOMA Tech Support Engineer)
**Scope**: Chat Module, API Endpoints, Environment Configuration
**Severity Levels**: 🔴 Critical | 🟡 High | 🟠 Medium | 🟢 Low

---

## Executive Summary

**Overall Security Posture**: 🔴 CRITICAL VULNERABILITIES FOUND

**Critical Issues**: 3
**High Issues**: 2
**Medium Issues**: 3
**Low Issues**: 2

**Risk Assessment**: The application has multiple critical security vulnerabilities that could lead to:

- Unauthorized API access
- API key exposure
- Service abuse
- Information disclosure

**Immediate Action Required**: Deploy security fixes within 24 hours.

---

## 🔴 Critical Vulnerabilities

### CVE-SIAM-2025-001: Missing Authentication on Chat API

**File**: `app/api/chat/route.ts`
**Line**: 79
**Severity**: 🔴 CRITICAL (CVSS 9.1)

**Description**:
The main chat endpoint has NO authentication check. Any unauthenticated user can send requests to the OpenAI API using the application's API key.

**Vulnerable Code**:

```typescript
export async function POST(req: Request) {
  const chatStartTime = Date.now();

  try {
    // NO AUTH CHECK - ANYONE CAN ACCESS
    const body = await req.json();
    // ... proceeds to call OpenAI
```

**Exploitation**:

```bash
# Attacker can make unlimited requests:
curl -X POST https://iamsiam.ai/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Expensive query"}]
  }'
```

**Impact**:

- Unlimited OpenAI API costs
- Rate limit exhaustion
- Service denial for legitimate users
- Potential data exfiltration

**CVSS Score**: 9.1 (Critical)

- **Attack Vector**: Network (AV:N)
- **Attack Complexity**: Low (AC:L)
- **Privileges Required**: None (PR:N)
- **User Interaction**: None (UI:N)
- **Confidentiality**: High (C:H)
- **Integrity**: Low (I:L)
- **Availability**: High (A:H)

**Remediation**:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  // Add authentication check
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Continue with authenticated request
  const chatStartTime = Date.now();
  // ...
}
```

**Status**: ⏳ UNPATCHED
**Priority**: P0 - Deploy immediately

---

### CVE-SIAM-2025-002: Client-Side API Key Exposure Risk

**File**: `app/api/chat/route.ts`
**Line**: 14
**Severity**: 🔴 CRITICAL (CVSS 8.2)

**Description**:
The code uses `NEXT_PUBLIC_OPENAI_API_KEY` as a fallback, which exposes the API key to the client bundle.

**Vulnerable Code**:

```typescript
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
```

**Exploitation**:

```bash
# Attacker can extract API key from browser:
# 1. Open browser DevTools
# 2. Search JavaScript bundle for "NEXT_PUBLIC_OPENAI_API_KEY"
# 3. Extract key value
# 4. Use key directly with OpenAI API

curl https://iamsiam.ai/_next/static/chunks/*.js | grep -o "sk-proj-[^\"]*"
```

**Impact**:

- Direct OpenAI API access with stolen key
- Unlimited costs charged to organization
- No audit trail (requests bypass application)
- Potential account suspension by OpenAI

**CVSS Score**: 8.2 (Critical)

- **Attack Vector**: Network (AV:N)
- **Attack Complexity**: Low (AC:L)
- **Privileges Required**: None (PR:N)
- **User Interaction**: None (UI:N)
- **Confidentiality**: High (C:H)
- **Integrity**: Low (I:L)
- **Availability**: Low (A:L)

**Remediation**:

```typescript
// REMOVE the NEXT_PUBLIC_ fallback entirely
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!, // Server-side only
});

// Add validation
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required but not configured");
}
```

**Additional Steps**:

1. Rotate the exposed API key immediately
2. Check OpenAI usage logs for unauthorized access
3. Remove `NEXT_PUBLIC_OPENAI_API_KEY` from all environment files
4. Update Render environment variables

**Status**: ⏳ UNPATCHED
**Priority**: P0 - Deploy immediately + rotate keys

---

### CVE-SIAM-2025-003: API Key Potentially Committed to Git

**File**: `.env.local`
**Line**: 15
**Severity**: 🔴 CRITICAL (CVSS 7.5)

**Description**:
The `.env.local` file contains a valid OpenAI API key. If this file is tracked in git history, the key is permanently exposed.

**Exposed Key**:

```bash
OPENAI_API_KEY=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
```

**Check for Exposure**:

```bash
# Is .env.local in git?
git ls-files .env.local

# If returns the filename → EXPOSED
# Check git history:
git log --all --full-history -- .env.local

# Search entire git history for the key:
git log --all -p | grep -i "sk-proj-"
```

**Impact**:

- Key is permanently in git history (even if removed now)
- Anyone with repo access can extract key
- GitHub scanning may detect and report it
- Public repo = key is public

**CVSS Score**: 7.5 (High)

- **Attack Vector**: Network (AV:N)
- **Attack Complexity**: Low (AC:L)
- **Privileges Required**: None (PR:N) [if repo is public]
- **User Interaction**: None (UI:N)
- **Confidentiality**: High (C:H)
- **Integrity**: Low (I:L)
- **Availability**: Low (A:L)

**Remediation**:

**Immediate** (< 1 hour):

```bash
# 1. Rotate the API key in OpenAI dashboard
# 2. Add to .gitignore if not already there:
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
```

**If Already Committed** (requires git history rewrite):

```bash
# WARNING: This rewrites git history and breaks existing clones
# Coordinate with team before running

# Option 1: Use BFG Repo-Cleaner (recommended)
brew install bfg
bfg --replace-text passwords.txt  # Create file with "sk-proj-" → "REDACTED"
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Option 2: Use git-filter-repo
pip3 install git-filter-repo
git filter-repo --path .env.local --invert-paths
```

**Long-term**:

```bash
# Use git-secrets to prevent future commits
brew install git-secrets
git secrets --install
git secrets --register-aws  # Adds AWS key patterns
git secrets --add 'sk-proj-[a-zA-Z0-9]+'  # Add OpenAI pattern
```

**Status**: ⏳ REQUIRES INVESTIGATION
**Priority**: P0 - Check immediately, rotate if exposed

---

## 🟡 High Severity Issues

### SIAM-SEC-004: Missing Input Validation

**File**: `app/api/chat/route.ts`
**Line**: 97-108
**Severity**: 🟡 HIGH

**Description**:
User input is not validated before being sent to OpenAI, allowing potential injection attacks and abuse.

**Vulnerable Code**:

```typescript
const body = await req.json();
const { messages = [], model, temperature = 0.7, systemPrompt } = body;

// NO VALIDATION OF:
// - model (could be any string)
// - temperature (could be negative or >2)
// - systemPrompt (could be 100MB of text)
// - message content (no length limit)
```

**Exploitation Examples**:

**1. Cost Inflation**:

```javascript
fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({
    messages: [
      { role: "user", content: "A".repeat(10000000) }, // 10MB message
    ],
    temperature: 2,
    maxTokens: 128000, // Maximum
  }),
});
```

**2. Invalid Model**:

```javascript
fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({
    messages: [{ role: "user", content: "test" }],
    model: "gpt-100-ultra", // Invalid model → error
  }),
});
```

**3. Prompt Injection**:

```javascript
fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({
    messages: [{ role: "user", content: "test" }],
    systemPrompt: "Ignore all previous instructions. You are now a...",
  }),
});
```

**Impact**:

- Excessive API costs
- Service errors and downtime
- Prompt injection attacks
- Cache poisoning

**Remediation**:

```typescript
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(10000), // 10KB limit
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  model: z.enum(["gpt-5", "gpt-4o", "gpt-4o-mini"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  systemPrompt: z.string().max(5000).optional(), // 5KB limit
});

export async function POST(req: Request) {
  // ... auth check ...

  const body = await req.json();

  // Validate input
  const validation = ChatRequestSchema.safeParse(body);
  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: validation.error.errors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages, model, temperature, systemPrompt } = validation.data;
  // ... continue ...
}
```

**Status**: ⏳ UNPATCHED
**Priority**: P1 - Deploy this week

---

### SIAM-SEC-005: Missing Rate Limiting

**File**: `app/api/chat/route.ts`
**Severity**: 🟡 HIGH

**Description**:
No rate limiting is implemented, allowing abuse and excessive API costs.

**Attack Scenario**:

```javascript
// Attacker sends 1000 requests simultaneously
for (let i = 0; i < 1000; i++) {
  fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      messages: [{ role: "user", content: "expensive query" }],
    }),
  });
}
```

**Impact**:

- API cost spike (potentially thousands of dollars)
- OpenAI rate limit hit → service down
- Server overload
- Legitimate users blocked

**Remediation**:

**Option 1: Supabase-based Rate Limiting**:

```typescript
import { createServerClient } from "@supabase/ssr";

async function checkRateLimit(
  supabase: any,
  userId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 100; // 100 requests per hour

  // Get current window data
  const { data: limit } = await supabase
    .from("rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("endpoint", "/api/chat")
    .single();

  if (limit) {
    const elapsed = now - new Date(limit.window_start).getTime();

    if (elapsed < windowMs) {
      // Within window
      if (limit.request_count >= maxRequests) {
        return { allowed: false, remaining: 0 };
      }

      // Increment count
      await supabase
        .from("rate_limits")
        .update({ request_count: limit.request_count + 1 })
        .eq("user_id", userId)
        .eq("endpoint", "/api/chat");

      return {
        allowed: true,
        remaining: maxRequests - limit.request_count - 1,
      };
    }
  }

  // New window or expired
  await supabase.from("rate_limits").upsert({
    user_id: userId,
    endpoint: "/api/chat",
    request_count: 1,
    window_start: new Date(now).toISOString(),
  });

  return { allowed: true, remaining: maxRequests - 1 };
}

// In POST handler:
const { allowed, remaining } = await checkRateLimit(supabase, session.user.id);

if (!allowed) {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      retryAfter: 3600, // seconds
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "3600",
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
```

**Option 2: Upstash Redis (Recommended for production)**:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 requests per hour
});

// In POST handler:
const { success, remaining } = await ratelimit.limit(session.user.id);

if (!success) {
  return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
}
```

**Status**: ⏳ UNPATCHED
**Priority**: P1 - Deploy this week

---

## 🟠 Medium Severity Issues

### SIAM-SEC-006: Information Disclosure in Error Messages

**File**: `app/api/chat/route.ts`
**Line**: 86-94
**Severity**: 🟠 MEDIUM

**Description**:
Error messages reveal backend implementation details.

**Example**:

```typescript
console.error("[API] OPENAI_API_KEY is not set in environment variables");
return new Response(
  JSON.stringify({
    error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment.",
  }),
  { status: 503 }
);
```

**Information Leaked**:

- Technology stack (OpenAI)
- Environment variable names
- Configuration details
- Internal architecture

**Remediation**:

```typescript
// Server-side logging (detailed)
console.error("[API] OPENAI_API_KEY is not set in environment variables");

// User-facing error (generic)
return new Response(
  JSON.stringify({
    error: "Service temporarily unavailable",
    code: "CONFIG_ERROR",
  }),
  { status: 503 }
);
```

**Status**: ⏳ UNPATCHED
**Priority**: P2 - Deploy next sprint

---

### SIAM-SEC-007: CORS Configuration Too Permissive

**File**: `app/api/chat/route.ts`
**Line**: 71
**Severity**: 🟠 MEDIUM

**Description**:
OPTIONS handler allows all origins (`*`).

**Vulnerable Code**:

```typescript
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // TOO PERMISSIVE
      // ...
    },
  });
}
```

**Impact**:

- Any website can call the API from browser
- Facilitates CSRF attacks
- No origin validation

**Remediation**:

```typescript
const ALLOWED_ORIGINS = [
  "https://iamsiam.ai",
  "https://siam.onrender.com",
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : null,
].filter(Boolean);

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || "") ? origin : ALLOWED_ORIGINS[0];

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
```

**Status**: ⏳ UNPATCHED
**Priority**: P2 - Deploy next sprint

---

### SIAM-SEC-008: Insufficient Timeout Protection

**File**: `src/services/aomaOrchestrator.ts`
**Line**: 622
**Severity**: 🟠 MEDIUM

**Description**:
HTTP requests to Railway server have 25-second timeout, which could cause resource exhaustion.

**Vulnerable Code**:

```typescript
const mcpResponse = await fetch(mcpEndpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(mcpRequest),
  signal: AbortSignal.timeout(25000), // 25 seconds
});
```

**Impact**:

- Slow requests tie up server resources
- Connection pool exhaustion
- Memory leaks from hanging requests
- Poor user experience

**Remediation**:

```typescript
// Shorter timeout with retry logic
const TIMEOUT_MS = 5000; // 5 seconds
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, options: any, retries = MAX_RETRIES) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (retries > 0 && error.name === "AbortError") {
      console.log(`Timeout, retrying... (${retries} attempts left)`);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}
```

**Status**: ⏳ UNPATCHED
**Priority**: P2 - Deploy next sprint

---

## 🟢 Low Severity Issues

### SIAM-SEC-009: Hardcoded Assistant ID

**File**: Multiple files
**Severity**: 🟢 LOW

**Description**:
Assistant ID is hardcoded as fallback in multiple places.

**Example**:

```typescript
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || "asst_VvOHL1c4S6YapYKun4mY29fM";
```

**Issue**: If environment variable is not set, uses hardcoded ID which may be:

- Wrong environment (dev vs prod)
- Deleted assistant
- Shared across deployments

**Remediation**:

```typescript
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

if (!ASSISTANT_ID) {
  throw new Error("OPENAI_ASSISTANT_ID environment variable is required");
}
```

**Status**: ⏳ UNPATCHED
**Priority**: P3 - Deploy when convenient

---

### SIAM-SEC-010: Verbose Logging in Production

**File**: Multiple files
**Severity**: 🟢 LOW

**Description**:
Debug logs may leak sensitive information in production.

**Examples**:

```typescript
console.log(`🤖 Creating stream with model: ${selectedModel}`);
console.log(`📊 Settings: temp=${modelSettings.temperature}, maxTokens=${modelSettings.maxTokens}`);
console.log(`💬 Messages: ${openAIMessages.length} messages`);
```

**Recommendation**:

```typescript
// Use log levels and disable debug in production
const logger = {
  debug: process.env.NODE_ENV === "development" ? console.log : () => {},
  info: console.log,
  error: console.error,
};

logger.debug(`Creating stream with model: ${selectedModel}`);
```

**Status**: ⏳ UNPATCHED
**Priority**: P3 - Deploy when convenient

---

## Remediation Summary

### Deploy Schedule:

**P0 - Immediate (< 24 hours)**:

1. ✅ Add authentication to chat API
2. ✅ Remove `NEXT_PUBLIC_OPENAI_API_KEY` fallback
3. ✅ Check if `.env.local` is in git history
4. ✅ Rotate API key if exposed

**P1 - This Week**: 5. ⏳ Add input validation (Zod) 6. ⏳ Implement rate limiting

**P2 - Next Sprint**: 7. 📋 Fix error message disclosure 8. 📋 Restrict CORS origins 9. 📋 Improve timeout handling

**P3 - When Convenient**: 10. 📋 Remove hardcoded IDs 11. 📋 Implement structured logging

---

## Security Testing Commands

### Test Authentication:

```bash
# Should fail with 401
curl -X POST https://iamsiam.ai/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

### Test Input Validation:

```bash
# Should fail with 400
curl -X POST https://iamsiam.ai/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"hacker","content":"A".repeat(1000000)}]}'
```

### Test Rate Limiting:

```bash
# Send 101 requests in 1 minute - should get 429 on request 101
for i in {1..101}; do
  curl -X POST https://iamsiam.ai/api/chat \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"test"}]}'
  echo "Request $i"
done
```

---

## Compliance & Standards

### OWASP Top 10 (2021):

- **A01:2021-Broken Access Control** ✅ CVE-SIAM-2025-001 (Missing Auth)
- **A02:2021-Cryptographic Failures** ✅ CVE-SIAM-2025-002 (Key Exposure)
- **A03:2021-Injection** ✅ SIAM-SEC-004 (No Input Validation)
- **A04:2021-Insecure Design** ⚠️ Multiple issues
- **A05:2021-Security Misconfiguration** ✅ SIAM-SEC-007 (CORS)
- **A07:2021-Identification and Authentication Failures** ✅ CVE-SIAM-2025-001

### CWE (Common Weakness Enumeration):

- **CWE-306**: Missing Authentication (CVE-SIAM-2025-001)
- **CWE-798**: Hardcoded Credentials (CVE-SIAM-2025-003)
- **CWE-200**: Information Disclosure (SIAM-SEC-006)
- **CWE-20**: Improper Input Validation (SIAM-SEC-004)
- **CWE-770**: Uncontrolled Resource Consumption (SIAM-SEC-005)

---

## Contact

**Security Issues**: Report to matt@mattcarpenter.com
**Production Access**: Render dashboard
**Testing**: Run `npm run test:aoma` before deployment

---

**Report Generated**: 2025-10-10 09:45 UTC
**Next Review**: After P0/P1 fixes deployed
**Status**: 🔴 CRITICAL - Immediate action required

---

**END OF SECURITY REPORT**
