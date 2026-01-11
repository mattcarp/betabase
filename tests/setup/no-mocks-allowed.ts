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

// ============================================================================
// GLOBAL POLYFILLS FOR NODE ENVIRONMENT
// ============================================================================

/**
 * localStorage polyfill for Node.js environment
 * This is NOT a mock - it's a real in-memory implementation for testing.
 * Required for Zustand persist middleware and other browser APIs.
 */
if (typeof globalThis.localStorage === 'undefined') {
  const storage = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() { return storage.size; },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
  };
}

/**
 * sessionStorage polyfill for Node.js environment (same API as localStorage)
 */
if (typeof globalThis.sessionStorage === 'undefined') {
  const storage = new Map<string, string>();
  globalThis.sessionStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() { return storage.size; },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
  };
}

/**
 * FileReader polyfill for Node.js environment
 * This is NOT a mock - it's a real implementation for testing.
 * Required for DDP parser and file upload functionality.
 */
if (typeof globalThis.FileReader === 'undefined') {
  class FileReaderPolyfill implements FileReader {
    EMPTY = 0 as const;
    LOADING = 1 as const;
    DONE = 2 as const;

    error: DOMException | null = null;
    readyState: number = this.EMPTY;
    result: string | ArrayBuffer | null = null;

    onabort: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
    onload: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
    onloadend: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
    onloadstart: ((this: FileReader, ev: ProgressEvent) => any) | null = null;
    onprogress: ((this: FileReader, ev: ProgressEvent) => any) | null = null;

    readAsArrayBuffer(blob: Blob): void {
      this.readyState = this.LOADING;

      blob.arrayBuffer().then((buffer) => {
        this.readyState = this.DONE;
        this.result = buffer;
        if (this.onload) {
          this.onload({} as ProgressEvent);
        }
        if (this.onloadend) {
          this.onloadend({} as ProgressEvent);
        }
      }).catch((err) => {
        this.readyState = this.DONE;
        this.error = err;
        if (this.onerror) {
          this.onerror({} as ProgressEvent);
        }
        if (this.onloadend) {
          this.onloadend({} as ProgressEvent);
        }
      });
    }

    readAsBinaryString(_blob: Blob): void {
      throw new Error('readAsBinaryString not implemented in polyfill');
    }

    readAsDataURL(_blob: Blob): void {
      throw new Error('readAsDataURL not implemented in polyfill');
    }

    readAsText(_blob: Blob, _encoding?: string): void {
      throw new Error('readAsText not implemented in polyfill');
    }

    abort(): void {
      this.readyState = this.DONE;
      if (this.onabort) {
        this.onabort({} as ProgressEvent);
      }
    }

    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject, _options?: boolean | AddEventListenerOptions): void {
      // No-op for testing
    }

    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject, _options?: boolean | EventListenerOptions): void {
      // No-op for testing
    }

    dispatchEvent(_event: Event): boolean {
      return true;
    }
  }

  (globalThis as any).FileReader = FileReaderPolyfill;
}

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

