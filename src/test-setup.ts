import "@testing-library/jest-dom";
import React from "react";

// Simple mock function factory
const createMockFunction = () => {
  const fn = (...args: any[]) => {};
  fn.mockImplementation = (impl: any) => impl;
  fn.mockResolvedValue = (value: any) => Promise.resolve(value);
  fn.mockReturnValue = (value: any) => value;
  return fn;
};

// Mock browser-based storage and notification APIs (web-only application)
const mockBrowserAPI = {
  localStorage: {
    get: createMockFunction(),
    set: createMockFunction(),
    delete: createMockFunction(),
  },
  notification: {
    requestPermission: createMockFunction(),
    show: createMockFunction(),
  },
};

// Mock Web APIs
(global as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

(global as any).IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  constructor() {}
};

// Mock AudioContext
(global as any).AudioContext = class AudioContext {
  createAnalyser() {
    return {
      connect: createMockFunction(),
      disconnect: createMockFunction(),
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: createMockFunction(),
    };
  }
  createMediaStreamSource() {
    return {
      connect: createMockFunction(),
      disconnect: createMockFunction(),
    };
  }
  close() {}
};

// Mock MediaDevices
Object.defineProperty(navigator, "mediaDevices", {
  writable: true,
  value: {
    getUserMedia: () =>
      Promise.resolve({
        getTracks: () => [
          {
            stop: createMockFunction(),
            kind: "audio",
          },
        ],
      }),
    enumerateDevices: () =>
      Promise.resolve([
        {
          deviceId: "default",
          kind: "audioinput",
          label: "Default Microphone",
        },
      ]),
  },
});

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id: number) => clearTimeout(id);

// Mock requestIdleCallback
(global as any).requestIdleCallback = (cb: any) => setTimeout(cb, 1);
(global as any).cancelIdleCallback = (id: any) => clearTimeout(id);

// Mock performance API
Object.defineProperty(global, "performance", {
  writable: true,
  value: {
    now: () => Date.now(),
    mark: createMockFunction(),
    measure: createMockFunction(),
    getEntriesByType: () => [],
    getEntriesByName: () => [],
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: createMockFunction(),
  setItem: createMockFunction(),
  removeItem: createMockFunction(),
  clear: createMockFunction(),
  length: 0,
  key: createMockFunction(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: createMockFunction(),
  warn: createMockFunction(),
  error: createMockFunction(),
  info: createMockFunction(),
  debug: createMockFunction(),
};

// Global test utilities
export const mockAudioData = new Uint8Array(128).fill(50);
export const mockTranscriptionData = {
  text: "Hello, this is a test transcription.",
  confidence: 0.95,
  timestamp: Date.now(),
};

export const mockSystemHealth = {
  cpu: 45,
  memory: 60,
  disk: 30,
  network: "connected",
  status: "healthy",
};

export const mockSettings = {
  theme: "dark",
  notifications: true,
  audioDevice: "default",
  transcriptionEnabled: true,
  opacity: 85,
};

// Test utilities
export const createMockComponent = (name: string) => {
  const Component = ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: any;
  }) => {
    return React.createElement(
      "div",
      {
        "data-testid": name.toLowerCase(),
        ...props,
      },
      children
    );
  };
  Component.displayName = name;
  return Component;
};

export const waitFor = (condition: () => boolean, timeout = 5000) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    const checkCondition = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
      } else {
        setTimeout(checkCondition, 10);
      }
    };
    checkCondition();
  });
};

export { mockBrowserAPI };
