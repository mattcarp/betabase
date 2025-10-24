import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment - use jsdom for React component testing
    environment: 'jsdom',
    
    // Make describe, test, expect available globally
    globals: true,
    
    // Setup file
    setupFiles: ['./tests/setup.vitest.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8', // Faster than Istanbul
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.test.ts',
        '**/*.test.tsx',
        '.next/',
        'playwright.config.ts',
        'playwright-ct.config.ts',
        'next.config.js',
        'tailwind.config.js',
        'postcss.config.js',
      ],
      // Quality gates
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 75,
        statements: 80,
      },
    },
    
    // Performance - use threads for parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    
    // UI - beautiful test interface
    ui: true,
    open: false, // Don't auto-open
    
    // Reporters
    reporters: ['verbose', 'json', 'html'],
    
    // Test isolation (can be disabled for speed if needed)
    isolate: true,
    
    // Watch mode optimizations
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/playwright-report/**',
      '**/coverage/**',
    ],
    
    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
})
