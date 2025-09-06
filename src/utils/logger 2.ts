/**
 * Debug logging utility - ALWAYS ENABLED for development
 * We want full visibility while troubleshooting
 */

// FORCE DEBUG MODE - we're actively developing
const isDevelopment = true; // Always true for now
const isDebugEnabled = true; // Always true for now

export const debugLog = (...args: any[]) => {
  console.log(...args);
};

export const debugError = (...args: any[]) => {
  console.error(...args);
};

export const debugWarn = (...args: any[]) => {
  console.warn(...args);
};

// Production-safe logs (always shown)
export const prodLog = (...args: any[]) => {
  console.log(...args);
};

export const prodError = (...args: any[]) => {
  console.error(...args);
};
