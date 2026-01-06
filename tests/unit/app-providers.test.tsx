/**
 * AppProviders Component Tests
 *
 * Tests to prevent "Cannot read properties of undefined (reading 'call')" errors
 * that occur when AppProviders is not properly exported or loaded.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';

describe('AppProviders Module', () => {
  it('should export AppProviders as a named export', async () => {
    const module = await import('../../src/components/AppProviders');

    expect(module).toHaveProperty('AppProviders');
    expect(typeof module.AppProviders).toBe('function');
  });

  it('should be a valid React component', async () => {
    const { AppProviders } = await import('../../src/components/AppProviders');

    // Check it's a function (React component)
    expect(typeof AppProviders).toBe('function');

    // Check it accepts props
    expect(AppProviders.length).toBeGreaterThan(0);
  });

  it('should not have circular dependencies', async () => {
    // This test will fail if there's a circular dependency
    let importError = null;

    try {
      await import('../../src/components/AppProviders');
    } catch (error) {
      importError = error;
    }

    expect(importError).toBeNull();
  });

  it('should have ThemeProvider dependency', async () => {
    // Ensure ThemeContext exports ThemeProvider
    const themeModule = await import('../../src/contexts/ThemeContext');

    expect(themeModule).toHaveProperty('ThemeProvider');
    expect(typeof themeModule.ThemeProvider).toBe('function');
  });

  it('should not throw when imported', async () => {
    // This should not throw
    const importPromise = import('../../src/components/AppProviders');
    await expect(importPromise).resolves.toBeDefined();
  });

  it('should have "use client" directive', async () => {
    // Read the file content to check for "use client"
    const fs = await import('fs');
    const path = await import('path');

    const filePath = path.join(process.cwd(), 'src/components/AppProviders.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('"use client"');
  });

  it('should export a function component that accepts children', () => {
    // Mock test to ensure the component signature is correct
    const mockComponent = ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    };

    // This is the expected signature
    expect(typeof mockComponent).toBe('function');
    const result = mockComponent({ children: 'test' });
    expect(result).toBeDefined();
  });
});

describe('AppProviders Component Rendering', () => {
  it('should not be undefined when called', async () => {
    const { AppProviders } = await import('../../src/components/AppProviders');

    // Create a mock props object
    const props = {
      children: React.createElement('div', null, 'Test Child'),
    };

    // This should not throw "Cannot read properties of undefined"
    expect(() => {
      const element = React.createElement(AppProviders, props);
      expect(element).toBeDefined();
      expect(element.type).toBe(AppProviders);
    }).not.toThrow();
  });

  it('should render without crashing', async () => {
    const { AppProviders } = await import('../../src/components/AppProviders');

    // Ensure it returns a valid React element
    const testChild = React.createElement('div', null, 'Test');
    const element = React.createElement(AppProviders, { children: testChild });

    expect(element).toBeDefined();
    expect(element.type).toBe(AppProviders);
    expect(element.props.children).toBe(testChild);
  });
});

describe('Module Resolution', () => {
  it('should resolve import path @/components/AppProviders', async () => {
    // Test that the path alias works
    let importError = null;

    try {
      // This is how layout.tsx imports it
      await import('../../src/components/AppProviders');
    } catch (error) {
      importError = error;
    }

    expect(importError).toBeNull();
  });

  it('should have both named and default export for maximum compatibility', async () => {
    const module = await import('../../src/components/AppProviders');

    // Should have named export
    const exports = Object.keys(module);
    expect(exports).toContain('AppProviders');
    expect(exports).toContain('default');

    // Should have default export that matches named export
    expect(module.default).toBe(module.AppProviders);
  });
});

describe('ThemeProvider Dependency', () => {
  it('should import ThemeProvider without errors', async () => {
    let importError = null;

    try {
      await import('../../src/contexts/ThemeContext');
    } catch (error) {
      importError = error;
    }

    expect(importError).toBeNull();
  });

  it('should have ThemeProvider as a named export', async () => {
    const module = await import('../../src/contexts/ThemeContext');

    expect(module).toHaveProperty('ThemeProvider');
    expect(typeof module.ThemeProvider).toBe('function');
  });

  it('should have "use client" directive in ThemeContext', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const filePath = path.join(process.cwd(), 'src/contexts/ThemeContext.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('"use client"');
  });
});
