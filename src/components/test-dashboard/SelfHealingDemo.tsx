"use client";

/**
 * Self-Healing Demo Component
 *
 * Interactive demonstration of AI-powered test self-healing.
 * Shows the full flow: original test -> UI change -> failure -> AI healing -> success
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Zap,
  Sparkles,
  ArrowRight,
  Code,
  Eye,
  AlertTriangle,
  Activity,
} from "lucide-react";

type DemoStep =
  | "idle"
  | "running-original"
  | "original-passed"
  | "ui-changed"
  | "running-broken"
  | "test-failed"
  | "analyzing"
  | "healing"
  | "healed"
  | "running-healed"
  | "healed-passed";

interface HealingResult {
  originalSelector: string;
  newSelector: string;
  confidence: number;
  strategy: string;
  alternatives: { selector: string; confidence: number }[];
}

export function SelfHealingDemo() {
  const [step, setStep] = useState<DemoStep>("idle");
  const [variant, setVariant] = useState(1);
  const [healingResult, setHealingResult] = useState<HealingResult | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const originalTest = `// Original Test
test('user can submit order', async ({ page }) => {
  await page.goto('/demo/self-healing');

  // Click the submit button
  await page.click('#submit-btn');

  // Verify success message
  await expect(page.locator('.text-green-400'))
    .toContainText('Order submitted');
});`;

  const brokenTest = `// Test FAILS - selector not found
test('user can submit order', async ({ page }) => {
  await page.goto('/demo/self-healing?variant=3');

  // ERROR: #submit-btn no longer exists!
  await page.click('#submit-btn'); // TIMEOUT

  // Never reaches this...
  await expect(page.locator('.text-green-400'))
    .toContainText('Order submitted');
});`;

  const healedTest = `// HEALED Test - AI updated selector
test('user can submit order', async ({ page }) => {
  await page.goto('/demo/self-healing?variant=3');

  // AI healed: #submit-btn -> #order-submit-button
  await page.click('#order-submit-button');

  // Verify success message
  await expect(page.locator('.text-green-400'))
    .toContainText('Order submitted');
});`;

  const simulateHealing = useCallback(() => {
    // Simulate AI analysis
    const result: HealingResult = {
      originalSelector: "#submit-btn",
      newSelector: "#order-submit-button",
      confidence: 0.94,
      strategy: "Text + Role Matching",
      alternatives: [
        { selector: "[data-testid='submit-action']", confidence: 0.89 },
        { selector: "button:has-text('Submit Order')", confidence: 0.85 },
        { selector: ".order-submit-btn", confidence: 0.72 },
      ],
    };
    setHealingResult(result);
    return result;
  }, []);

  const runDemo = useCallback(async () => {
    setLogs([]);
    setHealingResult(null);

    // Step 1: Run original test
    setStep("running-original");
    setVariant(1);
    addLog("Running original test against TechStore checkout...");
    await sleep(2500);

    setStep("original-passed");
    addLog("Test PASSED - Found button with id='submit-btn'");
    addLog("Button clicked successfully, order submitted");
    await sleep(3000);

    // Step 2: UI Changed - THIS IS THE KEY MOMENT
    setStep("ui-changed");
    setVariant(3);
    addLog("-------------------------------------------");
    addLog("DEVELOPER REFACTORED THE CHECKOUT BUTTON");
    addLog("Renamed: id='submit-btn' -> id='order-submit-button'");
    addLog("(Common during code cleanup sprints)");
    await sleep(4000);

    // Step 3: Run broken test
    setStep("running-broken");
    addLog("Running same test against updated UI...");
    await sleep(2000);

    setStep("test-failed");
    addLog("TEST FAILED!");
    addLog("Error: Selector '#submit-btn' not found after 30s timeout");
    addLog("The element exists but with a different ID");
    await sleep(4000);

    // Step 4: AI Analysis - SHOW THE THINKING
    setStep("analyzing");
    addLog("-------------------------------------------");
    addLog("SELF-HEALING AI ACTIVATED");
    await sleep(1500);
    addLog("Step 1: Loading DOM snapshot from last passing run...");
    await sleep(1500);
    addLog("Step 2: Comparing with current DOM state...");
    await sleep(1500);
    addLog("Step 3: Analyzing button by: text content, role, position, siblings...");
    await sleep(2000);
    addLog("Step 4: Found candidate: same text 'Complete Purchase', same position");
    await sleep(1500);

    // Step 5: Healing
    setStep("healing");
    const result = simulateHealing();
    addLog("-------------------------------------------");
    addLog(`MATCH FOUND: ${result.newSelector}`);
    addLog(`Confidence: ${(result.confidence * 100).toFixed(0)}% (Tier 1 - Auto-heal threshold)`);
    await sleep(2000);
    addLog(`Strategy used: ${result.strategy}`);
    await sleep(1000);

    setStep("healed");
    addLog("-------------------------------------------");
    addLog("AUTO-HEAL APPLIED");
    addLog("Test code updated: page.click('#submit-btn') -> page.click('#order-submit-button')");
    await sleep(3000);

    // Step 6: Verify healed test
    setStep("running-healed");
    addLog("Re-running test with healed selector...");
    await sleep(2500);

    setStep("healed-passed");
    addLog("-------------------------------------------");
    addLog("HEALED TEST PASSED!");
    addLog("Button found and clicked with new selector");
    addLog("Order submitted successfully");
    addLog("");
    addLog("NO HUMAN INTERVENTION REQUIRED");
    addLog("Test automatically fixed in 2.3 seconds");
  }, [addLog, simulateHealing]);

  const reset = () => {
    setStep("idle");
    setVariant(1);
    setHealingResult(null);
    setLogs([]);
    setIsAutoPlay(false);
  };

  useEffect(() => {
    if (isAutoPlay && step === "idle") {
      runDemo();
    }
  }, [isAutoPlay, step, runDemo]);

  const getStepColor = (s: DemoStep) => {
    if (s === step) return "border-blue-500 bg-blue-500/10";
    const order = [
      "idle",
      "running-original",
      "original-passed",
      "ui-changed",
      "running-broken",
      "test-failed",
      "analyzing",
      "healing",
      "healed",
      "running-healed",
      "healed-passed",
    ];
    const currentIdx = order.indexOf(step);
    const stepIdx = order.indexOf(s);
    if (stepIdx < currentIdx) return "border-green-500/50 bg-green-500/5";
    return "border-border bg-transparent";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-zinc-900/50 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Self-Healing Demo
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Watch AI automatically fix broken selectors in real-time
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={step === "idle"}
                className="border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (step === "idle") runDemo();
                  else reset();
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {step === "idle" ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Demo
                  </>
                ) : step === "healed-passed" ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Run Again
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-pulse" />
                    Running...
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Demo Area */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: App Preview */}
        <Card className="bg-zinc-900/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Eye className="h-4 w-4 text-blue-400" />
              App Under Test
              <Badge
                variant="outline"
                className={`ml-2 ${variant === 1 ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}`}
              >
                Variant {variant}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-border">
              <iframe
                src={`/demo/self-healing?variant=${variant}`}
                className="w-full h-[400px] bg-zinc-950"
                title="Demo App"
              />
            </div>
            {step === "ui-changed" && (
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  UI Changed!
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Button ID changed from <code className="text-amber-300">#submit-btn</code> to{" "}
                  <code className="text-amber-300">#order-submit-button</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Test Code */}
        <Card className="bg-zinc-900/50 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Code className="h-4 w-4 text-purple-400" />
              Test Code
              {step === "test-failed" && (
                <Badge className="bg-red-500/10 text-red-400 border-red-500/30">FAILED</Badge>
              )}
              {step === "healed-passed" && (
                <Badge className="bg-green-500/10 text-green-400 border-green-500/30">HEALED & PASSED</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre
              className={`p-4 rounded-lg text-xs font-mono overflow-auto h-[400px] border ${
                step === "test-failed"
                  ? "bg-red-950/30 border-red-500/30 text-red-300"
                  : step === "healed" || step === "running-healed" || step === "healed-passed"
                    ? "bg-green-950/30 border-green-500/30 text-green-300"
                    : "bg-zinc-950 border-border text-zinc-300"
              }`}
            >
              {step === "idle" || step === "running-original" || step === "original-passed"
                ? originalTest
                : step === "ui-changed" || step === "running-broken" || step === "test-failed" || step === "analyzing"
                  ? brokenTest
                  : healedTest}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Progress Steps */}
      <Card className="bg-zinc-900/50 border-border">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {[
              { key: "original-passed", label: "Original", icon: CheckCircle },
              { key: "ui-changed", label: "UI Changed", icon: AlertTriangle },
              { key: "test-failed", label: "Test Failed", icon: XCircle },
              { key: "analyzing", label: "AI Analyzing", icon: Zap },
              { key: "healed", label: "Auto-Healed", icon: Sparkles },
              { key: "healed-passed", label: "Verified", icon: CheckCircle },
            ].map((s, idx, arr) => (
              <React.Fragment key={s.key}>
                <div
                  className={`flex flex-col items-center gap-2 px-4 py-2 rounded-lg border transition-all ${getStepColor(s.key as DemoStep)}`}
                >
                  <s.icon
                    className={`h-5 w-5 ${
                      step === s.key
                        ? "text-blue-400"
                        : s.key === "test-failed" && step === "test-failed"
                          ? "text-red-400"
                          : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                {idx < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Healing Result */}
      {healingResult && (step === "healed" || step === "running-healed" || step === "healed-passed") && (
        <Card className="bg-zinc-900/50 border-green-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-green-400">
              <Sparkles className="h-4 w-4" />
              AI Healing Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Original Selector</div>
                <code className="text-red-400 text-sm">{healingResult.originalSelector}</code>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">New Selector</div>
                <code className="text-green-400 text-sm">{healingResult.newSelector}</code>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-1000"
                      style={{ width: `${healingResult.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-green-400 font-mono text-sm">
                    {(healingResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Alternative Selectors Considered</div>
              <div className="space-y-1">
                {healingResult.alternatives.map((alt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <code className="text-zinc-400">{alt.selector}</code>
                    <span className="text-muted-foreground">{(alt.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      <Card className="bg-zinc-900/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground">
            <Activity className="h-4 w-4 text-blue-400" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 overflow-auto bg-zinc-950 rounded-lg p-3 font-mono text-xs">
            {logs.length === 0 ? (
              <span className="text-muted-foreground">Click "Run Demo" to start...</span>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.includes("FAILED") || log.includes("ERROR")
                      ? "text-red-400"
                      : log.includes("PASSED") || log.includes("HEALED")
                        ? "text-green-400"
                        : log.includes("CHANGED")
                          ? "text-amber-400"
                          : "text-zinc-400"
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
