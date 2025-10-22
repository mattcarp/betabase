# 🎯 IMMEDIATE CODING PRIORITIES

# Test Dashboard Implementation - Quick Reference

## TODAY'S FOCUS - PHASE 1 FOUNDATION

### 🔴 PRIORITY 1: Component Structure (Do First!)

```bash
# 1. Create directory structure
mkdir -p src/components/testing/panels
mkdir -p src/components/testing/visualizations
mkdir -p src/components/testing/hooks
```

### Files to Create:

#### 1️⃣ `src/components/testing/TestDashboard.tsx`

```typescript
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExecutionPanel } from "./panels/ExecutionPanel";
import { ResultsPanel } from "./panels/ResultsPanel";
import { AnalyticsPanel } from "./panels/AnalyticsPanel";

export const TestDashboard: React.FC = () => {
  // This replaces the current test tab content
  // Keep glassmorphic theme
  // Integrate with existing layout
};
```

#### 2️⃣ `src/components/testing/panels/ExecutionPanel.tsx`

```typescript
// Real-time test execution view
// Start with mock data
// Add WebSocket later
```

#### 3️⃣ `src/stores/testStore.ts`

```typescript
// Zustand store for test state
// Follow existing patterns
```

### 🟡 PRIORITY 2: Update Existing Test Tab

**File:** `src/components/ui/pages/ChatPage.tsx`
**Line:** 217-242
**Action:** Replace ChatPanel with TestDashboard

```typescript
// OLD (line 217-242):
<TabsContent value="test" className="h-full m-0">
  <div className="h-full p-6">
    <Card className="h-full">
      ...
      <ChatPanel ... />
    </Card>
  </div>
</TabsContent>

// NEW:
<TabsContent value="test" className="h-full m-0">
  <TestDashboard />
</TabsContent>
```

### 🟢 PRIORITY 3: API Routes

Create these files:

```
app/api/testing/
├── execution/
│   └── start/route.ts    # Start test execution
├── analysis/
│   └── results/route.ts  # Get test results
```

### 🔵 PRIORITY 4: Mock Data Service

**File:** `src/services/mockTestData.ts`

```typescript
export const getMockTestRun = () => ({
  id: "run-" + Date.now(),
  status: "running",
  progress: { total: 100, completed: 45, passed: 40, failed: 3 },
  // ... more mock data
});
```

## 🏃 QUICK COMMANDS

```bash
# Start fresh
cd /Users/matt/Documents/projects/siam
git status
git stash  # If needed

# Create branch
git checkout -b feature/unified-test-dashboard

# Commit foundation
git add src/components/testing
git commit -m "feat(test-dashboard): Add foundation components"

# Run dev
npm run dev
```

## ✅ PHASE 1 CHECKLIST

- [ ] Create TestDashboard component
- [ ] Create ExecutionPanel with mock data
- [ ] Create test store (Zustand)
- [ ] Update ChatPage.tsx test tab
- [ ] Create basic API route structure
- [ ] Test that dashboard renders
- [ ] Verify glassmorphic styling matches
- [ ] Commit and push

## 🎨 STYLING REFERENCE

```tsx
// Glass panel style (use everywhere)
<div className="bg-background/80 backdrop-blur-xl border border-primary/20 rounded-lg p-6">

// Status colors
const statusColors = {
  passed: 'text-green-500',
  failed: 'text-red-500',
  running: 'text-blue-500',
  pending: 'text-gray-500',
  flaky: 'text-amber-500'
};

// Card hover effect
className="transition-all hover:scale-[1.02] hover:shadow-xl"
```

## ⚡ WEBSOCKET SETUP (After basics work)

```typescript
// src/hooks/useTestWebSocket.ts
import { useEffect } from "react";
import io from "socket.io-client";

export const useTestWebSocket = (runId: string) => {
  // Implementation after basic UI works
};
```

## 🗂️ FILE IMPORTS REFERENCE

```typescript
// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { Play, Pause, RotateCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

// Utils
import { cn } from "@/lib/utils";
```

## 🚫 DON'T FORGET

1. **Keep existing auth** - Everything requires authentication
2. **Dark theme only** - No light theme
3. **TypeScript strict** - No `any` types
4. **Use existing patterns** - Check other components first
5. **Atomic commits** - Small, focused changes

---

**START HERE:** Create `TestDashboard.tsx` → Update `ChatPage.tsx` → Test it works → Continue building!
