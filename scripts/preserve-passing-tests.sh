#!/usr/bin/env bash
set -euo pipefail

# Preserve passing tests as a stable foundation

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TESTS_DIR="$ROOT_DIR/tests"
FOUNDATION_DIR="$TESTS_DIR/foundation"
OUT_DIR="$ROOT_DIR/tmp/preserve"
RESULTS_JSON="$OUT_DIR/results.json"

mkdir -p "$OUT_DIR" "$FOUNDATION_DIR"

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }
log() { echo "[$(timestamp)] $*"; }

if ! command -v npx >/dev/null 2>&1; then
  log "npx not found. Please install Node.js."
  exit 1
fi

log "Running Playwright to identify passing tests ..."
set +e
npx --yes playwright test --reporter=json > "$RESULTS_JSON" 2>"$OUT_DIR/stderr.log"
set -e

if [ ! -s "$RESULTS_JSON" ]; then
  log "No JSON results produced. Aborting."
  exit 1
fi

log "Extracting passing test files ..."
node > "$OUT_DIR/passing-files.txt" <<'NODE'
const fs = require('fs');
const p = process.argv[2];
const raw = fs.readFileSync(p, 'utf8');
let data;
try { data = JSON.parse(raw); } catch (e) { process.exit(0); }
const passingFiles = new Set();
function walk(suite){
  if(!suite) return;
  (suite.specs||[]).forEach(spec=>{
    let allPassed = true;
    (spec.tests||[]).forEach(t=>{
      const r = (t.results && t.results[0]) || {};
      const st = r.status || t.status;
      if(st !== 'passed') allPassed = false;
    });
    if(allPassed) passingFiles.add(spec.file);
  });
  (suite.suites||[]).forEach(walk);
}
(data.suites||[]).forEach(walk);
for (const f of passingFiles) console.log(f);
NODE
"$RESULTS_JSON"

COUNT=$(wc -l < "$OUT_DIR/passing-files.txt" | tr -d ' ')
log "Found $COUNT files where all tests passed. Copying to foundation directory ..."

while IFS= read -r src; do
  [ -z "$src" ] && continue
  base="$(basename "$src")"
  dest="$FOUNDATION_DIR/$base"
  cp -f "$src" "$dest"
  log "Preserved: $src -> $dest"
done < "$OUT_DIR/passing-files.txt"

log "Preservation complete. Passing tests copied to $FOUNDATION_DIR"










