#!/usr/bin/env bash
set -euo pipefail

# SIAM Test Suite Cleanup (safe by default: dry-run)
# - Identifies duplicates and numbered variants
# - Proposes moves into a clean hierarchy
# - Archives experimental/broken tests
# - With --apply, executes the plan (after creating a full backup)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TESTS_DIR="$ROOT_DIR/tests"
ARCHIVE_DIR="$TESTS_DIR/archive"
OUT_DIR="$ROOT_DIR/tmp/test-cleanup"
PLAN_FILE="$OUT_DIR/cleanup-plan.txt"
APPLY=false

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
  esac
done

mkdir -p "$OUT_DIR" "$ARCHIVE_DIR" "$TESTS_DIR/helpers" "$TESTS_DIR/fixtures" \
  "$TESTS_DIR/unit" "$TESTS_DIR/integration" "$TESTS_DIR/e2e" "$TESTS_DIR/visual" \
  "$TESTS_DIR/performance" "$TESTS_DIR/e2e/auth" "$TESTS_DIR/e2e/chat" "$TESTS_DIR/e2e/upload" "$TESTS_DIR/e2e/critical-paths"

timestamp() { date "+%Y-%m-%d_%H-%M-%S"; }
log() { echo "[$(date "+%H:%M:%S")] $*"; }

backup() {
  local ts="$(timestamp)"
  local dest="$OUT_DIR/tests-backup-$ts.tar.gz"
  log "Creating backup archive: $dest"
  tar -czf "$dest" -C "$ROOT_DIR" tests
}

normalize_name() {
  local f="$1"; local b
  b="$(basename "$f")"; b="${b%.*}"
  b="${b//_/ }"; b="${b//-/ }"; b="$(echo "$b" | tr -s ' ')"
  echo "$b" | sed -E 's/( copy| v(ersion)?| spec)?[[:space:]_-]*[0-9]+$//I' | awk '{$1=$1};1' | tr '[:upper:]' '[:lower:]'
}

classify_purpose() {
  local p="$(echo "$1" | tr '[:upper:]' '[:lower:]')"
  case "$p" in
    *auth*|*login*|*signin*|*cognito*) echo "e2e/auth";;
    *upload*|*uploader*|*file*) echo "e2e/upload";;
    *chat*|*message*) echo "e2e/chat";;
    *visual*|*screenshot*|*snapshot*) echo "visual";;
    *api*|*endpoint*|*route*) echo "integration";;
    *perf*|*performance*|*load*) echo "performance";;
    *) echo "e2e";;
  esac
}

mapfile -t FILES < <(find "$TESTS_DIR" -type f \( -iname "*.spec.*" -o -iname "*.test.*" \) | sort)

declare -A GROUPS
for f in "${FILES[@]}"; do
  key="$(normalize_name "$f")"
  GROUPS["$key"]+="$f\n"
done

log "Writing cleanup plan to $PLAN_FILE (dry-run). Use --apply to execute."
{
  echo "# Cleanup Plan ($(timestamp))"
  echo "# This is a DRY-RUN plan. Re-run with --apply to make changes."
  echo ""
} > "$PLAN_FILE"

actions() {
  local from="$1"; local to="$2"
  echo "MOVE|$from|$to" >> "$PLAN_FILE"
}

# 1) Remove exact duplicates (keep first)
declare -A HASHES; declare -A HASH_GROUP
for f in "${FILES[@]}"; do
  h="$(shasum "$f" | awk '{print $1}')" || h="$(openssl dgst -sha1 "$f" | awk '{print $2}')"
  HASH_GROUP["$h"]+="$f\n"
done
for h in "${!HASH_GROUP[@]}"; do
  IFS=$'\n' read -rd '' -a arr <<< "${HASH_GROUP[$h]}" || true
  if [ ${#arr[@]} -gt 1 ]; then
    # keep first, archive others
    for ((i=1;i<${#arr[@]};i++)); do
      echo "ARCHIVE|${arr[$i]}|$ARCHIVE_DIR/" >> "$PLAN_FILE"
    done
  fi
done

# 2) Numbered variants: keep the longest (by bytes) as the best version
for key in "${!GROUPS[@]}"; do
  IFS=$'\n' read -rd '' -a arr <<< "${GROUPS[$key]}" || true
  if [ ${#arr[@]} -gt 1 ]; then
    best=""; best_size=0
    for f in "${arr[@]}"; do
      s=$(wc -c <"$f" | tr -d ' ')
      if [ "$s" -gt "$best_size" ]; then best="$f"; best_size="$s"; fi
    done
    for f in "${arr[@]}"; do
      if [ "$f" != "$best" ]; then
        echo "ARCHIVE|$f|$ARCHIVE_DIR/" >> "$PLAN_FILE"
      fi
    done
  fi
done

# 3) Propose directory restructuring
for f in "${FILES[@]}"; do
  rel="${f#"$TESTS_DIR/"}"
  target_sub="$(classify_purpose "$rel")"
  # preserve filename
  base="$(basename "$f")"
  dest="$TESTS_DIR/$target_sub/$base"
  if [ "$f" != "$dest" ]; then
    actions "$f" "$dest"
  fi
done

if $APPLY; then
  backup
  while IFS='|' read -r kind src dst; do
    case "$kind" in
      ARCHIVE)
        mkdir -p "$dst"
        log "Archiving $src -> $dst"
        git mv -f "$src" "$dst" 2>/dev/null || mv -f "$src" "$dst"
        ;;
      MOVE)
        mkdir -p "$(dirname "$dst")"
        log "Moving $src -> $dst"
        git mv -f "$src" "$dst" 2>/dev/null || mv -f "$src" "$dst"
        ;;
    esac
  done < <(grep -E '^(ARCHIVE|MOVE)\|' "$PLAN_FILE" || true)
  log "Cleanup applied. Plan recorded at $PLAN_FILE"
else
  log "Dry-run complete. Review plan at $PLAN_FILE. Re-run with --apply to execute."
fi








