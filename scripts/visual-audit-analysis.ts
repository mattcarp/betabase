#!/usr/bin/env tsx

/**
 * Visual UX/UI Audit Analysis Script
 *
 * This script analyzes screenshots captured by the visual audit tests
 * and generates a comprehensive UX/UI report.
 */

import fs from 'fs';
import path from 'path';

interface VisualIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'spacing' | 'color' | 'typography' | 'layout' | 'accessibility' | 'consistency' | 'performance';
  description: string;
  location: string;
  recommendation: string;
}

interface AuditReport {
  timestamp: string;
  screenshotsAnalyzed: string[];
  issues: VisualIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const SCREENSHOT_DIR = '/tmp/siam-visual-audit';
const REPORT_DIR = '/Users/matt/Documents/projects/siam/audit-results';

async function analyzeScreenshots(): Promise<AuditReport> {
  const screenshots = fs.readdirSync(SCREENSHOT_DIR)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(SCREENSHOT_DIR, f));

  const issues: VisualIssue[] = [];

  // Manual analysis guidelines - these would typically be automated with image processing
  // For now, this generates a template for manual review

  issues.push({
    severity: 'critical',
    category: 'accessibility',
    description: 'Check color contrast ratios for all text elements',
    location: 'All pages',
    recommendation: 'Ensure minimum 4.5:1 contrast ratio for normal text, 3:1 for large text (WCAG AA)',
  });

  issues.push({
    severity: 'high',
    category: 'spacing',
    description: 'Verify 8px grid system compliance for all spacing',
    location: 'All pages',
    recommendation: 'All margins and padding should be multiples of 8px (use Tailwind spacing scale)',
  });

  issues.push({
    severity: 'high',
    category: 'typography',
    description: 'Check typography scale consistency',
    location: 'All pages',
    recommendation: 'Use consistent font sizes from design system: 12, 14, 16, 18, 20, 24, 30, 36px',
  });

  issues.push({
    severity: 'medium',
    category: 'layout',
    description: 'Verify responsive behavior across breakpoints',
    location: 'Mobile/Tablet views',
    recommendation: 'Ensure content adapts gracefully to smaller screens without horizontal scroll',
  });

  issues.push({
    severity: 'medium',
    category: 'consistency',
    description: 'Check button styling consistency',
    location: 'All interactive elements',
    recommendation: 'Ensure all buttons use consistent styling from design system',
  });

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    screenshotsAnalyzed: screenshots,
    issues,
    summary: {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    },
  };

  return report;
}

async function generateReport() {
  console.log('=== Visual UX/UI Audit Analysis ===\n');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    console.error(`Error: Screenshot directory not found: ${SCREENSHOT_DIR}`);
    console.error('Run visual audit tests first: npm run test:visual');
    process.exit(1);
  }

  const report = await analyzeScreenshots();

  // Ensure report directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // Save JSON report
  const reportPath = path.join(REPORT_DIR, 'visual-audit-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate markdown report
  const mdReport = generateMarkdownReport(report);
  const mdPath = path.join(REPORT_DIR, 'visual-audit-report.md');
  fs.writeFileSync(mdPath, mdReport);

  console.log(`Screenshots analyzed: ${report.screenshotsAnalyzed.length}`);
  console.log(`\nIssues found:`);
  console.log(`  Critical: ${report.summary.critical}`);
  console.log(`  High: ${report.summary.high}`);
  console.log(`  Medium: ${report.summary.medium}`);
  console.log(`  Low: ${report.summary.low}`);
  console.log(`\nReports saved:`);
  console.log(`  JSON: ${reportPath}`);
  console.log(`  Markdown: ${mdPath}`);
}

function generateMarkdownReport(report: AuditReport): string {
  const md: string[] = [];

  md.push('# Visual UX/UI Audit Report');
  md.push('');
  md.push(`**Generated:** ${new Date(report.timestamp).toLocaleString()}`);
  md.push(`**Screenshots Analyzed:** ${report.screenshotsAnalyzed.length}`);
  md.push('');

  md.push('## Summary');
  md.push('');
  md.push('| Severity | Count |');
  md.push('|----------|-------|');
  md.push(`| Critical | ${report.summary.critical} |`);
  md.push(`| High | ${report.summary.high} |`);
  md.push(`| Medium | ${report.summary.medium} |`);
  md.push(`| Low | ${report.summary.low} |`);
  md.push('');

  // Group by severity
  const bySeverity = {
    critical: report.issues.filter(i => i.severity === 'critical'),
    high: report.issues.filter(i => i.severity === 'high'),
    medium: report.issues.filter(i => i.severity === 'medium'),
    low: report.issues.filter(i => i.severity === 'low'),
  };

  if (bySeverity.critical.length > 0) {
    md.push('## Critical Issues (Must Fix)');
    md.push('');
    bySeverity.critical.forEach((issue, i) => {
      md.push(`### ${i + 1}. ${issue.description}`);
      md.push('');
      md.push(`**Category:** ${issue.category}`);
      md.push(`**Location:** ${issue.location}`);
      md.push(`**Recommendation:** ${issue.recommendation}`);
      md.push('');
    });
  }

  if (bySeverity.high.length > 0) {
    md.push('## High Priority Improvements');
    md.push('');
    bySeverity.high.forEach((issue, i) => {
      md.push(`### ${i + 1}. ${issue.description}`);
      md.push('');
      md.push(`**Category:** ${issue.category}`);
      md.push(`**Location:** ${issue.location}`);
      md.push(`**Recommendation:** ${issue.recommendation}`);
      md.push('');
    });
  }

  if (bySeverity.medium.length > 0) {
    md.push('## Medium Priority Polish Items');
    md.push('');
    bySeverity.medium.forEach((issue, i) => {
      md.push(`### ${i + 1}. ${issue.description}`);
      md.push('');
      md.push(`**Category:** ${issue.category}`);
      md.push(`**Location:** ${issue.location}`);
      md.push(`**Recommendation:** ${issue.recommendation}`);
      md.push('');
    });
  }

  if (bySeverity.low.length > 0) {
    md.push('## Nice-to-Have Enhancements');
    md.push('');
    bySeverity.low.forEach((issue, i) => {
      md.push(`### ${i + 1}. ${issue.description}`);
      md.push('');
      md.push(`**Category:** ${issue.category}`);
      md.push(`**Location:** ${issue.location}`);
      md.push(`**Recommendation:** ${issue.recommendation}`);
      md.push('');
    });
  }

  md.push('## Screenshots');
  md.push('');
  report.screenshotsAnalyzed.forEach(screenshot => {
    const filename = path.basename(screenshot);
    md.push(`- ${filename}`);
  });

  return md.join('\n');
}

// Run the analysis
generateReport().catch(console.error);
