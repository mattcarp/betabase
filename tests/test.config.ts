// Test Configuration Index
// This file helps IDEs understand our test structure

export const TEST_CONFIG = {
  // Directory structure
  directories: {
    root: "./tests",
    api: "./tests/api",
    auth: "./tests/auth",
    e2e: "./tests/e2e",
    visual: "./tests/visual",
    helpers: "./tests/helpers",
    fixtures: "./tests/fixtures",
    screenshots: "./tests/screenshots",
    local: "./tests/local",
    production: "./tests/production",
    comprehensive: "./tests/comprehensive",
  },

  // Test patterns
  patterns: {
    unit: "**/*.spec.ts",
    integration: "**/*-integration.spec.ts",
    e2e: "**/e2e/**/*.spec.ts",
    visual: "**/visual/**/*.spec.ts",
  },

  // Environment configs
  configs: {
    local: "playwright.config.local.ts",
    production: "playwright.config.ts",
    render: "playwright.config.render.ts",
    dashboard: "playwright.config.dashboard.ts",
  },

  // Test tags
  tags: {
    smoke: "@smoke", // Critical path tests
    regression: "@regression", // Full suite
    visual: "@visual", // Visual tests
    api: "@api", // API tests
    auth: "@auth", // Auth tests
    slow: "@slow", // Long-running
    prod: "@production", // Prod only
    local: "@local", // Local only
  },

  // Helper imports
  helpers: {
    auth: "./helpers/auth",
    testUtils: "./helpers/test-utils",
    dataGenerator: "./helpers/test-data-generator",
    mailgun: "./helpers/mailgun-helper",
  },

  // Common selectors
  selectors: {
    // Authentication
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    submitButton: '[data-testid="submit-button"]',
    logoutButton: '[data-testid="logout-button"]',

    // Navigation
    chatTab: 'button[role="tab"]:has-text("Chat")',
    curateTab: 'button[role="tab"]:has-text("Curate")',
    analyticsTab: 'button[role="tab"]:has-text("Analytics")',

    // Chat interface
    chatInput: '[data-testid="chat-input"]',
    sendButton: '[data-testid="send-button"]',
    messageList: '[data-testid="message-list"]',

    // Upload interface
    uploadArea: '[data-testid="upload-area"]',
    fileInput: 'input[type="file"]',
    uploadProgress: '[data-testid="upload-progress"]',
  },

  // Test data
  testUsers: {
    admin: {
      email: "admin@sonymusic.com",
      password: process.env.TEST_ADMIN_PASSWORD,
    },
    standard: {
      email: "matt@mattcarpenter.com",
      password: process.env.TEST_USER_PASSWORD,
    },
  },

  // Timeouts
  timeouts: {
    navigation: 30000,
    action: 15000,
    assertion: 5000,
    api: 10000,
  },

  // Screenshots
  screenshots: {
    enabled: true,
    onFailure: true,
    fullPage: false,
    path: "./tests/screenshots",
  },
};

// Helper function to get config by environment
export function getConfig(env: "local" | "production" | "render" = "local") {
  return TEST_CONFIG.configs[env];
}

// Helper to build selector
export function getSelector(component: keyof typeof TEST_CONFIG.selectors) {
  return TEST_CONFIG.selectors[component];
}

// Export for use in tests
export default TEST_CONFIG;
