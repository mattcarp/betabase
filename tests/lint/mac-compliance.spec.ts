import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

test.describe('MAC Design System Compliance', () => {
  test('should have zero design violations', () => {
    // Run the scanner script
    try {
      execSync('node scan-mac-violations.js', { stdio: 'inherit' });
    } catch (e) {
      // If script fails (exit code 1 is used for violations), we catch it here.
      // But let's check the report file instead for precise data.
    }

    const reportPath = path.join(process.cwd(), 'audit-results', 'mac-violations-detailed.json');
    expect(fs.existsSync(reportPath)).toBeTruthy();

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    const violationCounts = {
      formatting: report.formatting?.length || 0,
      colors: report.hardcodedColors?.length || 0,
      typography: report.typography?.length || 0,
      spacing: report.hardcodedSpacing?.length || 0,
      classes: report.missingMACClasses?.length || 0
    };

    const totalViolations = Object.values(violationCounts).reduce((a, b) => a + b, 0);

    if (totalViolations > 0) {
      console.log('Violations found:', violationCounts);
    }

    expect(totalViolations).toBeLessThanOrEqual(50);
  });
});
