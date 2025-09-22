#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Validating environment..."
REQUIRED_VARS=( "OPENAI_API_KEY" "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" )
for v in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "❌ Missing required env var: $v"
    exit 1
  fi
done

FRONT="${GIT_FRONTEND_REPO_PATH:-}"
BACK="${GIT_BACKEND_REPO_PATH:-}"
ADDL="${GIT_ADDITIONAL_REPOS:-}"

REPOS=()
[[ -n "$FRONT" ]] && REPOS+=("$FRONT")
[[ -n "$BACK" ]] && REPOS+=("$BACK")
IFS=',' read -r -a ADDL_ARR <<< "$ADDL"
for r in "${ADDL_ARR[@]}"; do
  [[ -n "$r" ]] && REPOS+=("$r")
done

if [[ ${#REPOS[@]} -eq 0 ]]; then
  echo "❌ No repositories configured. Set GIT_FRONTEND_REPO_PATH or GIT_BACKEND_REPO_PATH or GIT_ADDITIONAL_REPOS."
  exit 1
fi

for repo in "${REPOS[@]}"; do
  if [[ ! -d "$repo/.git" ]]; then
    echo "❌ Not a git repo: $repo"
    exit 1
  fi
done

echo "✅ Repositories validated: ${REPOS[*]}"

echo "🚀 Indexing via Next API: /api/git-repo-index"
curl -sS -X POST "http://localhost:3000/api/git-repo-index" \
  -H 'Content-Type: application/json' \
  -d '{"includeCommits": true, "includeFiles": true}' | jq '.' || true

echo "✅ Indexing request submitted. Monitor logs for progress."


