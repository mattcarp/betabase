import { describe, test } from 'vitest';

/**
 * Integration Test Helpers
 *
 * These helpers skip integration tests unless INTEGRATION_TESTS env var is set.
 * This allows unit tests to run independently without requiring a dev server.
 *
 * Usage:
 *   import { describeIntegration, testIntegration } from '../helpers/integration-test';
 *
 *   describeIntegration("Email API", () => {
 *     testIntegration("should post email", async () => {
 *       // test code that requires localhost:3000
 *     });
 *   });
 */

const isIntegrationTest = !!process.env.INTEGRATION_TESTS;

/**
 * Skip integration tests unless INTEGRATION_TESTS env var is set
 */
export function describeIntegration(
  name: string,
  fn: () => void
) {
  return describe.skipIf(!isIntegrationTest)(name, fn);
}

/**
 * Skip integration test unless INTEGRATION_TESTS env var is set
 */
export function testIntegration(
  name: string,
  fn: () => void | Promise<void>
) {
  return test.skipIf(!isIntegrationTest)(name, fn);
}
