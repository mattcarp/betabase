#!/usr/bin/env bash
set -euo pipefail

# SIAM Test Suite Analyzer (macOS-compatible)

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TESTS_DIR="$ROOT_DIR/tests"
OUT_DIR="$ROOT_DIR/tmp/test-analysis"
REPORTS_DIR="$ROOT_DIR/docs/testing"
PLAYWRIGHT_JSON="$OUT_DIR/playwright-results.json"
SUMMARY_MD="$REPORTS_DIR/test-suite-analysis-latest.md"

mkdir -p "$OUT_DIR" "$REPORTS_DIR"

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }
log() { echo "[$(timestamp)] $*"; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

log "Scanning tests and building inventory (Node-based) ..."
ROOT_DIR="$ROOT_DIR" TESTS_DIR="$TESTS_DIR" OUT_DIR="$OUT_DIR" node <<'NODE'
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.ROOT_DIR;
const TESTS = process.env.TESTS_DIR || path.join(ROOT, 'tests');
const OUT = process.env.OUT_DIR || path.join(ROOT, 'tmp', 'test-analysis');
const INV = path.join(OUT, 'test-file-inventory.json');
const DUP = path.join(OUT, 'test-duplicates.json');

const exts = new Set(['.ts', '.tsx', '.js']);
const match = (f) => {
  const e = path.extname(f);
  const n = f.toLowerCase();
  return exts.has(e) && (n.endsWith('.spec'+e) || n.endsWith('.test'+e));
};

function walk(dir){
  const out=[];
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })){
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function normalizeName(fp){
  const base = path.basename(fp).replace(/\.[^.]+$/, '')
    .replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return base.replace(/( copy| v(ersion)?| spec)?[\s_-]*[0-9]+$/i, '').toLowerCase();
}

function sha1(file){
  const buf = fs.readFileSync(file);
  return crypto.createHash('sha1').update(buf).digest('hex');
}

function purpose(fp){
  const s = fp.toLowerCase();
  if (/(auth|login|signin|cognito)/.test(s)) return 'auth';
  if (/(upload|uploader|file)/.test(s)) return 'upload';
  if (/(chat|message)/.test(s)) return 'chat';
  if (/(visual|screenshot|snapshot)/.test(s)) return 'visual';
  if (/(api|endpoint|route)/.test(s)) return 'api';
  if (/(perf|performance|load)/.test(s)) return 'performance';
  return 'other';
}

const files = walk(TESTS).filter(match).sort();
const inventory = [];
const byNorm = new Map();
const byHash = new Map();

for (const f of files){
  let h;
  try { h = sha1(f); } catch { h = ''; }
  const n = normalizeName(f);
  const p = purpose(f);
  inventory.push({ path: f, name: path.basename(f), purpose: p, hash: h });
  if (!byNorm.has(n)) byNorm.set(n, []);
  byNorm.get(n).push(f);
  if (!byHash.has(h)) byHash.set(h, []);
  byHash.get(h).push(f);
}

fs.writeFileSync(INV, JSON.stringify({ totalFiles: files.length, files: inventory }, null, 2));

const dupJson = {
  byNormalizedName: Object.fromEntries([...byNorm.entries()]),
  byHash: Object.fromEntries([...byHash.entries()])
};
fs.writeFileSync(DUP, JSON.stringify(dupJson, null, 2));
NODE

RUN_OK=false
if command_exists npx; then
  log "Running Playwright for JSON report (may take a while) ..."
  set +e
  npx --yes playwright test --reporter=json > "$PLAYWRIGHT_JSON" 2>"$OUT_DIR/playwright.stderr"
  [ -s "$PLAYWRIGHT_JSON" ] && RUN_OK=true
  set -e
else
  log "npx not available; skipping Playwright run"
fi

FAILURE_JSON="$OUT_DIR/test-failures.json"
METRICS_JSON="$OUT_DIR/test-metrics.json"

if $RUN_OK; then
  PLAYWRIGHT_JSON="$PLAYWRIGHT_JSON" OUT_DIR="$OUT_DIR" node <<'NODE'
const fs = require('fs');
const path = require('path');
const P = process.env.PLAYWRIGHT_JSON;
const OUT = process.env.OUT_DIR;
const raw = fs.readFileSync(P, 'utf8');
let data; try { data = JSON.parse(raw); } catch { data = {}; }
const failures=[]; const summary={ total:0, passed:0, failed:0, skipped:0, timedOut:0, flaky:0 };
let totalDuration=0;
const walk=(s)=>{
  if(!s) return;
  (s.specs||[]).forEach(spec=>{
    (spec.tests||[]).forEach(t=>{
      summary.total++;
      const r=(t.results&&t.results[0])||{};
      totalDuration += r.duration||0;
      const st=r.status||t.status||'unknown';
      if(st==='passed') summary.passed++; else if(st==='skipped') summary.skipped++; else if(/timedout?/i.test(st)) summary.timedOut++; else if(st==='flaky') summary.flaky++; else summary.failed++;
      if(st!=='passed'){
        const err=r.error||{}; const msg=(err.message||'').toLowerCase();
        let type='assertion';
        if(msg.includes('timeout')||msg.includes('timed out')) type='timeout';
        else if(msg.includes('net::')||msg.includes('network')||msg.includes('fetch')) type='network';
        else if(msg.includes('expect')||msg.includes('assert')) type='assertion';
        failures.push({ title: spec.title, file: spec.file, project: t.projectName, status: st, type, error: err.message||'' });
      }
    });
  });
  (s.suites||[]).forEach(walk);
};
(data.suites||[]).forEach(walk);
fs.writeFileSync(path.join(OUT, 'test-failures.json'), JSON.stringify({ summary, failures }, null, 2));
fs.writeFileSync(path.join(OUT, 'test-metrics.json'), JSON.stringify({ totalDurationMs: totalDuration }, null, 2));
NODE
fi

log "Writing Markdown summary ..."
OUT_DIR="$OUT_DIR" REPORTS_DIR="$REPORTS_DIR" PLAYWRIGHT_JSON="$PLAYWRIGHT_JSON" node <<'NODE'
const fs=require('fs');
const path=require('path');
const OUT=process.env.OUT_DIR; const REPORTS=process.env.REPORTS_DIR; const PJSON=process.env.PLAYWRIGHT_JSON; const SUMMARY=path.join(REPORTS,'test-suite-analysis-latest.md');
let inv={totalFiles:0};
try{ inv=JSON.parse(fs.readFileSync(path.join(OUT,'test-file-inventory.json'),'utf8')); }catch{}
let ran=false; try{ ran=fs.statSync(PJSON).size>0; }catch{}
let failures={summary:{}}; try{ failures=JSON.parse(fs.readFileSync(path.join(OUT,'test-failures.json'),'utf8')); }catch{}
const lines=[];
lines.push('## Test Suite Analysis (Automated)');
lines.push('');
lines.push(`- Generated: ${new Date().toISOString()}`);
lines.push(`- Total test files: ${inv.totalFiles}`);
lines.push('- Inventory JSON: tmp/test-analysis/test-file-inventory.json');
lines.push('- Duplicates JSON: tmp/test-analysis/test-duplicates.json');
lines.push(ran ? '- Playwright Results: tmp/test-analysis/playwright-results.json' : '- Playwright run: skipped');
if(ran){
  lines.push('- Failure Summary: tmp/test-analysis/test-failures.json');
  lines.push('- Metrics: tmp/test-analysis/test-metrics.json');
  const s=failures.summary||{};
  lines.push('');
  lines.push('### Result Summary');
  lines.push(`- total: ${s.total||0}`);
  lines.push(`- passed: ${s.passed||0}`);
  lines.push(`- failed: ${s.failed||0}`);
  lines.push(`- skipped: ${s.skipped||0}`);
  lines.push(`- timedOut: ${s.timedOut||0}`);
  lines.push(`- flaky: ${s.flaky||0}`);
}
fs.writeFileSync(SUMMARY, lines.join('\n')+'\n');
NODE

log "Analysis complete. Outputs in $OUT_DIR and summary at $SUMMARY_MD"


