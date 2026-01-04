import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    // Run the blast radius demo tests
    const { stdout, stderr } = await execAsync(
      'pnpm playwright test tests/e2e/demo/blast-radius-login.spec.ts --reporter=json',
      { 
        cwd: process.cwd(),
        timeout: 60000 // 60 second timeout
      }
    )
    
    // Parse the JSON output
    let results
    try {
      results = JSON.parse(stdout)
    } catch {
      // If JSON parsing fails, return raw output
      return NextResponse.json({
        success: true,
        passed: 0,
        failed: 0,
        skipped: 0,
        rawOutput: stdout,
        stderr
      })
    }

    // Extract stats from Playwright JSON report
    const stats = results.stats || {}
    
    return NextResponse.json({
      success: true,
      passed: stats.expected || 0,
      failed: stats.unexpected || 0,
      skipped: stats.skipped || 0,
      duration: stats.duration || 0,
      suites: results.suites?.length || 0
    })
  } catch (error) {
    console.error('Failed to run blast radius tests:', error)
    
    // Even if tests fail, we want to return the results
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Try to extract pass/fail counts from error output
    const stdout = (error as { stdout?: string })?.stdout || ''
    const passedMatch = stdout.match(/(\d+) passed/)
    const failedMatch = stdout.match(/(\d+) failed/)
    const skippedMatch = stdout.match(/(\d+) skipped/)
    
    return NextResponse.json({
      success: false,
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
      error: errorMessage
    })
  }
}
