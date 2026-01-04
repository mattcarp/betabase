/**
 * TDD Test: No Hardcoded Colors
 *
 * This test enforces the MAC Design System rule against hardcoded colors.
 * Files must use semantic tokens (bg-background, text-foreground, border-border)
 * instead of hardcoded values (zinc-*, gray-*, slate-*, #hex).
 *
 * Why: Hardcoded colors break light/dark theme switching.
 * Reference: docs/THEME-PREP-AUDIT.md
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

// Phase 1: Quick Wins - COMPLETED
const PHASE_1_FILES = [
  'src/components/sessions/SessionCard.tsx',
  'src/components/ui/FloatingPanel.tsx',
  'src/components/ai/demo-enhancements/HeroMetricsStrip.tsx',
  'src/components/LoadingStates.tsx',
  'src/components/ui/layout/LeftSidebar.tsx',
  'src/components/SkeletonLoader.tsx',
  'src/components/ai/AOMAProgress.tsx',
  'src/components/ai-elements/NanoBananaInfographic.tsx',
  'src/components/ui/rlhf-tabs/FineTuningJobsPanel.tsx',
  'src/components/ui/app-sidebar.tsx',
];

// Phase 2: Core Layout & Pages
const PHASE_2_FILES = [
  'src/components/HUDLayout.tsx',
  'src/components/ui/layout/RightSidebar.tsx',
  'src/components/ui/pages/ChatPage.tsx',
  'src/app/error.tsx',
  'src/app/performance/page.tsx',
  'src/app/sessions/page.tsx',
  'src/app/test-elevenlabs/page.tsx',
  'src/app/test-nanobanana/page.tsx',
  'src/app/visual-regression-demo/page.tsx',
  'src/app/demo/self-healing/SelfHealingDemo.tsx',
];

// Phase 3: UI Primitives & Common Components
const PHASE_3_FILES = [
  'src/components/ui/tabs.tsx',
  'src/components/ui/ProfessionalProgress.tsx',
  'src/components/ui/ResponseDebugger.tsx',
  'src/components/ui/ResponseRenderer.tsx',
  'src/components/ui/ConnectionStatusIndicator.tsx',
  'src/components/ui/IntrospectionDropdown.tsx',
  'src/components/ui/AudioWaveformResponse.tsx',
  'src/components/ui/SearchResultsResponse.tsx',
  'src/components/ui/TopicVisualization.tsx',
  'src/components/ui/LatencyWaterfall.tsx',
  'src/components/ui/RAGComparisonCard.tsx',
  'src/components/ui/QuickFixPanel.tsx',
  'src/components/ui/FeedbackTimeline.tsx',
  'src/components/ui/CuratorQueue.tsx',
  'src/components/ui/CleanCurateTab.tsx',
  'src/components/ui/DashboardTab.tsx',
  'src/components/ui/RLHFFeedbackTab.tsx',
  'src/components/ui/RLHFCuratorDashboard.tsx',
  'src/components/ui/TestCaseGenerator.tsx',
  'src/components/ui/rlhf-tabs/TrainingDatasetsPanel.tsx',
  'src/components/ui/rlhf-tabs/AgentInsightsTab.tsx',
  'src/components/ui/rlhf-tabs/ModelRegistryPanel.tsx',
];

// Phase 4: Feature Components
const PHASE_4_FILES = [
  'src/components/ai/ai-sdk-chat-panel.tsx',
  'src/components/ai/chat-panel.tsx',
  'src/components/ai/FeedbackSegueDialog.tsx',
  'src/components/ai/demo-enhancements/ConfidenceBadge.tsx',
  'src/components/ai/demo-enhancements/DemoMode.tsx',
  'src/components/ai/demo-enhancements/DiagramOffer.tsx',
  'src/components/ai/demo-enhancements/RAGContextViewer.tsx',
  'src/components/ai/demo-enhancements/SourceCard.tsx',
  'src/components/AIInsightsDashboard.tsx',
  'src/components/ConversationalAI.tsx',
  'src/components/DocumentUpload.tsx',
  'src/components/LiveTranscription.tsx',
  'src/components/SettingsPanel.tsx',
  'src/components/sessions/EmptyState.tsx',
  'src/components/auth/MagicLinkLoginForm.tsx',
  'src/components/auth/ui/PasswordInput.tsx',
  'src/components/auth/ui/VerificationCodeInput.tsx',
  'src/components/rlhf/ComparisonPanel.tsx',
  'src/components/rlhf/CuratorWorkspace.tsx',
  'src/components/rlhf/CuratorWorkspaceContainer.tsx',
  'src/components/rlhf/FeedbackAnalytics.tsx',
  'src/components/rlhf/FeedbackBadge.tsx',
  'src/components/rlhf/FeedbackImpactLive.tsx',
  'src/components/rlhf/FeedbackModal.tsx',
  'src/components/visual-regression/ImageComparisonSlider.tsx',
  'src/components/test-dashboard/AITestGenerator.tsx',
  'src/components/test-dashboard/FirecrawlPanel.tsx',
  'src/components/test-dashboard/HistoricalTestExplorer.tsx',
  'src/components/test-dashboard/LiveRAGMonitor.tsx',
  'src/components/test-dashboard/ManualTestingPanel.tsx',
  'src/components/test-dashboard/RLHFImpactDashboard.tsx',
  'src/components/test-dashboard/RLHFTestSuite.tsx',
  'src/components/test-dashboard/SelfHealingDemo.tsx',
  'src/components/test-dashboard/SelfHealingFeedbackCapture.tsx',
  'src/components/test-dashboard/SelfHealingTestViewer.tsx',
  'src/components/test-dashboard/TestDashboard.tsx',
  'src/components/test-dashboard/TestExecutionPanel.tsx',
  'src/components/test-dashboard/TestHomeDashboard.tsx',
  'src/components/test-dashboard/TestResultsViewer.tsx',
  'src/components/test-dashboard/TraceViewer.tsx',
  'src/components/test-dashboard/UnifiedResultsDashboard.tsx',
];

// All files combined
const ALL_FILES = [...PHASE_1_FILES, ...PHASE_2_FILES, ...PHASE_3_FILES, ...PHASE_4_FILES];

// Regex patterns that indicate hardcoded colors (violations)
const VIOLATION_REGEX =
  /\b(bg|text|border|hover:bg|hover:text|focus:bg|focus:ring|divide|ring)-(zinc|gray|slate)-\d+/g;

function getViolationsInFile(filePath: string): { line: number; match: string; context: string }[] {
  const fullPath = join(process.cwd(), filePath);

  if (!existsSync(fullPath)) {
    return [];
  }

  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  const violations: { line: number; match: string; context: string }[] = [];

  lines.forEach((lineContent, index) => {
    const matches = lineContent.match(VIOLATION_REGEX);
    if (matches) {
      matches.forEach((match) => {
        violations.push({
          line: index + 1,
          match,
          context: lineContent.trim().substring(0, 80),
        });
      });
    }
  });

  return violations;
}

describe('Phase 1: No Hardcoded Colors - Quick Wins', () => {
  PHASE_1_FILES.forEach((file) => {
    it(`${file} should have no hardcoded color classes`, () => {
      const violations = getViolationsInFile(file);
      expect(violations.length).toBe(0);
    });
  });
});

describe('Phase 2: Core Layout & Pages', () => {
  PHASE_2_FILES.forEach((file) => {
    it(`${file} should have no hardcoded color classes`, () => {
      const violations = getViolationsInFile(file);

      if (violations.length > 0) {
        const message = violations.slice(0, 5).map((v) => `Line ${v.line}: ${v.match}`).join('\n');
        expect(violations.length, `${file}:\n${message}`).toBe(0);
      }

      expect(violations.length).toBe(0);
    });
  });
});

describe('Phase 3: UI Primitives & Common Components', () => {
  PHASE_3_FILES.forEach((file) => {
    it(`${file} should have no hardcoded color classes`, () => {
      const violations = getViolationsInFile(file);

      if (violations.length > 0) {
        const message = violations.slice(0, 5).map((v) => `Line ${v.line}: ${v.match}`).join('\n');
        expect(violations.length, `${file}:\n${message}`).toBe(0);
      }

      expect(violations.length).toBe(0);
    });
  });
});

describe('Phase 4: Feature Components', () => {
  PHASE_4_FILES.forEach((file) => {
    it(`${file} should have no hardcoded color classes`, () => {
      const violations = getViolationsInFile(file);

      if (violations.length > 0) {
        const message = violations.slice(0, 5).map((v) => `Line ${v.line}: ${v.match}`).join('\n');
        expect(violations.length, `${file}:\n${message}`).toBe(0);
      }

      expect(violations.length).toBe(0);
    });
  });
});

describe('Full Theme Preparation Summary', () => {
  it('should report overall progress', () => {
    const results = ALL_FILES.map((file) => ({
      file,
      violations: getViolationsInFile(file).length,
    }));

    const totalViolations = results.reduce((sum, r) => sum + r.violations, 0);
    const cleanFiles = results.filter((r) => r.violations === 0).length;

    console.log('\n=== Theme Preparation Progress ===');
    console.log(`Clean files: ${cleanFiles}/${ALL_FILES.length}`);
    console.log(`Total violations remaining: ${totalViolations}`);

    if (totalViolations > 0) {
      console.log('\nFiles with violations:');
      results
        .filter((r) => r.violations > 0)
        .forEach((r) => console.log(`  ${r.file}: ${r.violations}`));
    } else {
      console.log('\nFULLY PREPARED FOR THEMING!');
    }

    expect(totalViolations).toBe(0);
  });
});
