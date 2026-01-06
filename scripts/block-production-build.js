#!/usr/bin/env node
/**
 * Production Build Blocker
 * 
 * This script prevents production builds from succeeding.
 * The site is intended for localhost development only.
 * 
 * To re-enable production builds, delete this file and remove 
 * the prebuild script from package.json.
 */

const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER === 'true' || process.env.IS_PULL_REQUEST !== undefined;
const isVercel = process.env.VERCEL === '1';
const isNetlify = process.env.NETLIFY === 'true';
const isCI = process.env.CI === 'true';

// Allow local builds even with NODE_ENV=production for testing
const isLocalhost = !isRender && !isVercel && !isNetlify;

if ((isRender || isVercel || isNetlify) && isProduction) {
  console.error('\n');
  console.error('╔════════════════════════════════════════════════════════════╗');
  console.error('║                                                            ║');
  console.error('║   🚫 PRODUCTION BUILD BLOCKED                              ║');
  console.error('║                                                            ║');
  console.error('║   This application is configured for localhost only.       ║');
  console.error('║   Production deployments are intentionally disabled.       ║');
  console.error('║                                                            ║');
  console.error('║   To re-enable production:                                 ║');
  console.error('║   1. Delete scripts/block-production-build.js              ║');
  console.error('║   2. Remove prebuild script from package.json              ║');
  console.error('║                                                            ║');
  console.error('╚════════════════════════════════════════════════════════════╝');
  console.error('\n');
  process.exit(1);
}

// console.log('✓ Build environment check passed (localhost/dev mode)');
