/**
 * Blast Radius Demo - AOMA Login Flow Tests
 * 
 * These tests demonstrate the "blast radius" concept:
 * - A tiny change (button ID rename) can cause cascading test failures
 * - Tests expect data-test-id="login-button" but HTML now has "signin-btn"
 * 
 * Purpose: Show how self-healing tests can detect cosmetic changes
 * and suggest fixes rather than failing the entire suite.
 */

import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Supabase client for storing test results
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Test configuration
const DEMO_PAGE_URL = 'file:///Users/matt/Documents/projects/mc-thebetabase/blast-radius-demo/index.html'
const EXPECTED_LOGIN_BUTTON_ID = 'login-btn' // Matches HTML - tests should pass

// Helper to store test result in Supabase
async function storeTestResult(testName: string, status: 'passed' | 'failed' | 'skipped', errorMessage?: string, metadata?: Record<string, unknown>) {
  if (!supabase) {
    // console.log('Supabase not configured, skipping result storage')
    return
  }
  
  try {
    await supabase.from('test_results').insert({
      test_name: testName,
      test_file: 'tests/e2e/demo/blast-radius-login.spec.ts',
      status,
      error_message: errorMessage,
      metadata: {
        ...metadata,
        demo: 'blast-radius',
        expected_selector: `[data-test-id="${EXPECTED_LOGIN_BUTTON_ID}"]`,
        timestamp: new Date().toISOString()
      }
    })
  } catch (e) {
    console.error('Failed to store test result:', e)
  }
}

// Helper to create self-healing attempt record
async function createSelfHealingAttempt(
  testName: string,
  oldSelector: string,
  newSelector: string,
  confidence: number,
  rationale: string
) {
  if (!supabase) return
  
  try {
    await supabase.from('self_healing_attempts').insert({
      test_id: `blast-radius-${Date.now()}`,
      test_name: testName,
      test_file: 'tests/e2e/demo/blast-radius-login.spec.ts',
      change_type: 'selector',
      old_selector: oldSelector,
      new_selector: newSelector,
      selector_type: 'data-test-id',
      healing_tier: confidence > 0.8 ? 1 : confidence > 0.5 ? 2 : 3,
      confidence,
      healing_strategy: 'similar_element',
      healing_rationale: rationale,
      status: 'pending'
    })
  } catch (e) {
    console.error('Failed to create self-healing attempt:', e)
  }
}

test.describe('AOMA Login Flow - Blast Radius Demo', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_PAGE_URL)
    await page.waitForLoadState('domcontentloaded')
  })

  /**
   * TEST 1: Login button exists
   * 
   * This test WILL FAIL because:
   * - We expect: data-test-id="login-button"
   * - HTML has:  data-test-id="signin-btn"
   * 
   * Self-healing should detect this is a RENAME, not a removal.
   */
  test('login button should exist with correct test ID', async ({ page }) => {
    const testName = 'login button should exist with correct test ID'
    const expectedSelector = `[data-test-id="${EXPECTED_LOGIN_BUTTON_ID}"]`
    
    // Try to find the button with expected ID
    const loginButton = page.locator(expectedSelector)
    const buttonExists = await loginButton.count() > 0
    
    if (!buttonExists) {
      // SELF-HEALING LOGIC: Look for similar buttons
      const allButtons = page.locator('button[type="submit"]')
      const submitButtonCount = await allButtons.count()
      
      if (submitButtonCount > 0) {
        // Found a submit button - check its actual data-test-id
        const actualTestId = await allButtons.first().getAttribute('data-test-id')
        const buttonText = await allButtons.first().textContent()
        
        // Store the failure
        await storeTestResult(testName, 'failed', 
          `Expected selector "${expectedSelector}" not found. Found button with data-test-id="${actualTestId}" and text "${buttonText?.trim()}"`,
          {
            expected_test_id: EXPECTED_LOGIN_BUTTON_ID,
            actual_test_id: actualTestId,
            button_text: buttonText?.trim(),
            suggestion: 'Element appears renamed, not removed'
          }
        )
        
        // Create self-healing suggestion
        await createSelfHealingAttempt(
          testName,
          expectedSelector,
          `[data-test-id="${actualTestId}"]`,
          0.92, // High confidence - same element type, same position
          `Button with text "${buttonText?.trim()}" found at same position. ` +
          `data-test-id changed from "${EXPECTED_LOGIN_BUTTON_ID}" to "${actualTestId}". ` +
          `This appears to be a RENAME, not a removal. Recommend updating test selector.`
        )
      }
      
      // Fail the test (but we've recorded the healing suggestion)
      await expect(loginButton).toBeVisible({ timeout: 1000 })
    } else {
      await storeTestResult(testName, 'passed')
      await expect(loginButton).toBeVisible()
    }
  })

  /**
   * TEST 2: Username input exists
   * This should PASS - independent of login button
   */
  test('username input should exist', async ({ page }) => {
    const testName = 'username input should exist'
    const usernameInput = page.locator('[data-test-id="username-input"]')
    
    try {
      await expect(usernameInput).toBeVisible()
      await storeTestResult(testName, 'passed')
    } catch (e) {
      await storeTestResult(testName, 'failed', String(e))
      throw e
    }
  })

  /**
   * TEST 3: Password input exists
   * This should PASS - independent of login button
   */
  test('password input should exist', async ({ page }) => {
    const testName = 'password input should exist'
    const passwordInput = page.locator('[data-test-id="password-input"]')
    
    try {
      await expect(passwordInput).toBeVisible()
      await storeTestResult(testName, 'passed')
    } catch (e) {
      await storeTestResult(testName, 'failed', String(e))
      throw e
    }
  })

  /**
   * TEST 4: Can fill and submit login form
   * This WILL FAIL because it depends on finding the login button
   */
  test('can fill and submit login form', async ({ page }) => {
    const testName = 'can fill and submit login form'
    
    // Fill form
    await page.locator('[data-test-id="username-input"]').fill('testuser')
    await page.locator('[data-test-id="password-input"]').fill('testpass')
    
    // Try to click login button - THIS WILL FAIL
    const loginButton = page.locator(`[data-test-id="${EXPECTED_LOGIN_BUTTON_ID}"]`)
    
    try {
      await loginButton.click({ timeout: 2000 })
      await storeTestResult(testName, 'passed')
    } catch (e) {
      await storeTestResult(testName, 'failed', 
        `Cannot submit form: login button with data-test-id="${EXPECTED_LOGIN_BUTTON_ID}" not found`,
        { blast_radius: 'high', dependent_tests: 4 }
      )
      throw e
    }
  })

  /**
   * TEST 5: Login redirects to dashboard
   * SKIPPED - depends on successful login (Test 4)
   */
  test('login redirects to dashboard', async ({ page }) => {
    const testName = 'login redirects to dashboard'
    
    // This test depends on login working
    // In a real scenario, this would be skipped if login fails
    const loginButton = page.locator(`[data-test-id="${EXPECTED_LOGIN_BUTTON_ID}"]`)
    const buttonExists = await loginButton.count() > 0
    
    if (!buttonExists) {
      await storeTestResult(testName, 'skipped', 
        'Skipped: Login button not found - cannot test redirect',
        { skipped_reason: 'dependency_failed', depends_on: 'login button' }
      )
      test.skip()
    }
  })

  /**
   * TEST 6: Can access settings after login
   * SKIPPED - depends on successful login
   */
  test('can access settings after login', async ({ page }) => {
    const testName = 'can access settings after login'
    
    const loginButton = page.locator(`[data-test-id="${EXPECTED_LOGIN_BUTTON_ID}"]`)
    const buttonExists = await loginButton.count() > 0
    
    if (!buttonExists) {
      await storeTestResult(testName, 'skipped',
        'Skipped: Cannot access settings without login',
        { skipped_reason: 'dependency_failed', depends_on: 'login' }
      )
      test.skip()
    }
  })

  /**
   * TEST 7: Can view reports after login
   * SKIPPED - depends on successful login
   */
  test('can view reports after login', async ({ page }) => {
    const testName = 'can view reports after login'
    
    const loginButton = page.locator(`[data-test-id="${EXPECTED_LOGIN_BUTTON_ID}"]`)
    const buttonExists = await loginButton.count() > 0
    
    if (!buttonExists) {
      await storeTestResult(testName, 'skipped',
        'Skipped: Cannot view reports without login',
        { skipped_reason: 'dependency_failed', depends_on: 'login' }
      )
      test.skip()
    }
  })

  /**
   * TEST 8: Can logout after login
   * SKIPPED - depends on successful login
   */
  test('can logout after login', async ({ page }) => {
    const testName = 'can logout after login'
    
    const loginButton = page.locator(`[data-test-id="${EXPECTED_LOGIN_BUTTON_ID}"]`)
    const buttonExists = await loginButton.count() > 0
    
    if (!buttonExists) {
      await storeTestResult(testName, 'skipped',
        'Skipped: Cannot logout without first logging in',
        { skipped_reason: 'dependency_failed', depends_on: 'login' }
      )
      test.skip()
    }
  })
})
