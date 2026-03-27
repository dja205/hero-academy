#!/usr/bin/env bash
# smoke-test.sh — build verification & runtime health check
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }

# --------------------------------------------------------------------------
# 1. Build
# --------------------------------------------------------------------------
echo "==> Running npm run build..."
if npm run build > /dev/null 2>&1; then
  pass "npm run build exited 0"
else
  fail "npm run build exited non-zero"
  echo ""
  echo "Results: $PASS passed, $FAIL failed"
  exit 1
fi

# --------------------------------------------------------------------------
# 2. Check required build outputs
# --------------------------------------------------------------------------
echo "==> Checking build outputs..."

for f in \
  packages/backend/dist/index.js \
  packages/backend/public/index.html \
  packages/shared/dist/index.js; do
  if [ -f "$f" ]; then
    pass "$f exists"
  else
    fail "$f missing"
  fi
done

# --------------------------------------------------------------------------
# 3. Runtime health check
# --------------------------------------------------------------------------
echo "==> Starting server for health check (port 3002)..."

export NODE_ENV=test
export PORT=3002
export DATABASE_PATH=":memory:"
export JWT_ACCESS_SECRET=smoke-test-secret
export JWT_REFRESH_SECRET=smoke-test-refresh

node packages/backend/dist/index.js &
SERVER_PID=$!

# Ensure cleanup on exit
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

# Wait up to 15 seconds for /health
HEALTH_OK=false
for i in $(seq 1 30); do
  if curl -sf http://localhost:3002/health > /dev/null 2>&1; then
    HEALTH_OK=true
    break
  fi
  sleep 0.5
done

if $HEALTH_OK; then
  pass "GET /health returned 200"
else
  fail "GET /health did not return 200 within 15 s"
fi

# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------
echo ""
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

exit 0
