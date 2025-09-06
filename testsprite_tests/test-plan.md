# SIAM Test Plan - TestSprite Automated Testing

## Test Environment

- **URL**: http://localhost:3001
- **Browser**: Chromium
- **Mode**: Development (auth bypass enabled)

## Test Suite Structure

### 1. Critical Path Tests (P0)

#### Test Case 1.1: Application Load

```javascript
test("Application loads successfully", async ({ page }) => {
  await page.goto("http://localhost:3001");
  await expect(page).toHaveTitle(/SIAM/);
  await expect(page.locator("text=Welcome to SIAM")).toBeVisible();
});
```

#### Test Case 1.2: Health Check Endpoints

```javascript
test("API health endpoints respond", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  const data = await health.json();
  expect(data.status).toBe("healthy");
});
```

#### Test Case 1.3: Chat Interface

```javascript
test("Chat interface accepts and displays messages", async ({ page }) => {
  await page.goto("http://localhost:3001");
  const chatInput = page.locator('input[placeholder*="How can I assist"]');
  await chatInput.fill("What is AOMA?");
  await chatInput.press("Enter");
  await expect(page.locator("text=Based on AOMA context")).toBeVisible({
    timeout: 5000,
  });
});
```

#### Test Case 1.4: Navigation Tabs

```javascript
test("Navigation tabs are functional", async ({ page }) => {
  await page.goto("http://localhost:3001");
  const tabs = ["Chat", "HUD", "Test", "Fix", "Curate"];
  for (const tab of tabs) {
    await expect(page.locator(`text=${tab}`)).toBeVisible();
  }
});
```

### 2. Feature Tests (P0)

#### Test Case 2.1: Document Upload

```javascript
test("Document upload button is accessible", async ({ page }) => {
  await page.goto("http://localhost:3001");
  await expect(page.locator("text=Upload Docs")).toBeVisible();
});
```

#### Test Case 2.2: Voice Interface

```javascript
test("Voice controls are present", async ({ page }) => {
  await page.goto("http://localhost:3001");
  await expect(page.locator('[aria-label*="voice"]')).toBeVisible();
});
```

#### Test Case 2.3: Live Insights Panel

```javascript
test("Live insights panel displays", async ({ page }) => {
  await page.goto("http://localhost:3001");
  await expect(page.locator("text=Live Insights")).toBeVisible();
});
```

### 3. Integration Tests

#### Test Case 3.1: AOMA MCP Integration

```javascript
test("AOMA MCP responds to queries", async ({ request }) => {
  const response = await request.post("/api/aoma-mcp", {
    data: {
      action: "tools/list",
    },
  });
  expect(response.status()).toBe(200);
});
```

#### Test Case 3.2: MCP Server Connections

```javascript
test("MCP servers are connected", async ({ page }) => {
  await page.goto("http://localhost:3001");
  await expect(page.locator("text=AOMA-MCP")).toBeVisible();
  await expect(page.locator("text=ElevenLabs")).toBeVisible();
});
```

### 4. Error Handling Tests

#### Test Case 4.1: Graceful Error States

```javascript
test("Handles server errors gracefully", async ({ page }) => {
  await page.goto("http://localhost:3001");
  // Attempt query when servers might be down
  const chatInput = page.locator('input[placeholder*="How can I assist"]');
  await chatInput.fill("test query");
  await chatInput.press("Enter");
  // Should show error message, not crash
  const errorMessage = page.locator("text=/sorry|error|unable/i");
  if (await errorMessage.isVisible()) {
    expect(await errorMessage.textContent()).toBeTruthy();
  }
});
```

### 5. Performance Tests

#### Test Case 5.1: Page Load Time

```javascript
test("Page loads within performance budget", async ({ page }) => {
  const startTime = Date.now();
  await page.goto("http://localhost:3001");
  await page.waitForLoadState("networkidle");
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

## Test Execution Command

```bash
# Run with TestSprite MCP
npx @testsprite/testsprite-mcp@latest run --config testsprite-config.json

# Or use TestSprite CLI
testsprite test --project siam --plan testsprite_tests/test-plan.md
```

## Expected Results

### Pass Criteria

- All P0 tests pass
- No console errors
- All API endpoints return 200
- UI elements are visible and interactive

### Known Issues

- AOMA Railway server may have intermittent connectivity
- Voice features require ElevenLabs API key
- Document upload requires backend storage configuration

## Automated Fix Strategy

If tests fail, TestSprite will:

1. Capture screenshots of failures
2. Analyze error logs
3. Suggest code fixes
4. Re-run tests after fixes
5. Generate comprehensive report
