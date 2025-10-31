#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const STORAGE_STATE_PATH = path.join(process.cwd(), 'tmp/aoma-stage-storage.json');
const COOKIE_OUT = path.join(process.cwd(), 'tmp/aoma-cookie.txt');
const TARGET_HOST = new URL(process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net').hostname;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isNotExpired(cookie) {
  if (typeof cookie.expires !== 'number') return true;
  if (cookie.expires === -1) return true;
  const nowSecs = Math.floor(Date.now() / 1000);
  return cookie.expires > nowSecs;
}

function domainMatches(cookieDomain, hostname) {
  const c = cookieDomain?.startsWith('.') ? cookieDomain.slice(1) : cookieDomain || '';
  return hostname === c || hostname.endsWith(`.${c}`);
}

try {
  const state = readJson(STORAGE_STATE_PATH);
  const cookies = (state.cookies || [])
    .filter((c) => domainMatches(c.domain, TARGET_HOST))
    .filter(isNotExpired);

  if (cookies.length === 0) {
    console.error('No valid cookies found in storage state for host:', TARGET_HOST);
    process.exit(2);
  }

  const header = cookies
    .map((c) => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`)
    .join('; ');

  fs.writeFileSync(COOKIE_OUT, header, 'utf8');
  console.log(JSON.stringify({ ok: true, cookies: cookies.length, out: COOKIE_OUT }));
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: String(err) }));
  process.exit(1);
}






