/**
 * NO MOCKS ALLOWED - Enforcement Setup
 * 
 * This setup file overrides Vitest's mock functions to throw errors,
 * enforcing a strict no-mock policy across all tests.
 * 
 * WHY: Mocks break TDD. They make tests pass when code is broken.
 * Tests should use REAL services or FAIL HONESTLY.
 */

import { vi } from 'vitest';

// Override vi.mock to throw error
const originalMock = vi.mock;
vi.mock = (...args: any[]) => {
  throw new Error(
    '❌ vi.mock is FORBIDDEN.\n' +
    'Use real services (Supabase, APIs) or let tests fail honestly.\n' +
    'Mocks make tests pass when code is broken. That\'s insane.\n' +
    `Attempted to mock: ${args[0]}`
  );
};

// Override vi.fn to throw error
const originalFn = vi.fn;
vi.fn = (...args: any[]) => {
  throw new Error(
    '❌ vi.fn is FORBIDDEN.\n' +
    'Use real functions or let tests fail honestly.\n' +
    'Mock functions prove nothing. Tests must validate actual behavior.'
  );
};

// Override vi.spyOn to throw error
const originalSpyOn = vi.spyOn;
vi.spyOn = (...args: any[]) => {
  throw new Error(
    '❌ vi.spyOn is FORBIDDEN.\n' +
    'Use real implementations or let tests fail honestly.\n' +
    'Spies on mocks are double-worthless. Test real behavior.\n' +
    `Attempted to spy on: ${args[0]}`
  );
};

// Override vi.hoisted to throw error (used to hoist mocks)
const originalHoisted = vi.hoisted;
vi.hoisted = (...args: any[]) => {
  throw new Error(
    '❌ vi.hoisted is FORBIDDEN.\n' +
    'This is used to hoist mocks, which are forbidden.\n' +
    'Use real services or let tests fail honestly.'
  );
};

console.log('✅ NO-MOCKS enforcement active. All mock functions will throw errors.');

