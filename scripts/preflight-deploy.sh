#!/usr/bin/env bash
#
# preflight-deploy.sh — runs through the Day-7+ deploy checklist before you
# click "Create Service" on Render or "Deploy" on Vercel.
#
# Modes:
#   ./preflight-deploy.sh local       Verifies local builds + tests still pass.
#   ./preflight-deploy.sh backend     Validates a backend/.env.deploy file.
#   ./preflight-deploy.sh frontend    Validates a frontend/.env.deploy file.
#   ./preflight-deploy.sh smoke <url> Hits a deployed backend's /health.
#   ./preflight-deploy.sh all         Runs local + reads ./preflight.env.
#
# Usage convention:
#   1. Copy backend/.env.example -> backend/.env.deploy, fill values.
#   2. Copy frontend/.env.example -> frontend/.env.deploy, fill values.
#      (These two files are gitignored. They exist purely for THIS script
#      to verify before you paste the values into Render / Vercel.)
#   3. Run: ./scripts/preflight-deploy.sh backend
#           ./scripts/preflight-deploy.sh frontend
#   4. After Render is up: ./scripts/preflight-deploy.sh smoke https://your.onrender.com
#
# Exit codes: 0 = pass, 1 = validation fail, 2 = bad usage.

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()    { echo -e "${GREEN}✓${NC} $1"; }
fail()  { echo -e "${RED}✗${NC} $1"; FAILED=1; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
section() { echo; echo -e "${YELLOW}── $1 ──${NC}"; }

FAILED=0

mode="${1:-all}"

run_local() {
  section "Local builds + tests"
  pnpm --filter @sorts/shared  build  >/dev/null && ok "shared build"  || fail "shared build"
  pnpm --filter @sorts/backend build  >/dev/null && ok "backend build" || fail "backend build"
  pnpm --filter @sorts/backend test   >/dev/null 2>&1 && ok "backend tests" || fail "backend tests"
  pnpm --filter @sorts/frontend build >/dev/null && ok "frontend build" || fail "frontend build"
}

# Validate a key=value env file. Required keys must be non-empty.
# Optional keys are reported as warnings only.
validate_env() {
  local file="$1"; shift
  local required=("$@")
  if [ ! -f "$file" ]; then fail "$file not found"; return 1; fi

  for key in "${required[@]}"; do
    local val
    val=$(grep -E "^$key=" "$file" | head -1 | cut -d= -f2- || true)
    val=$(echo "$val" | sed 's/^"//;s/"$//;s/^ *//;s/ *$//')
    if [ -z "$val" ]; then
      fail "$file: $key is empty"
    else
      ok "$file: $key set (${#val} chars)"
    fi
  done
}

# Specific format checks. Add cheap regex validators as we discover bad inputs.
check_url()       { [[ "$1" =~ ^https?:// ]] || return 1; }
check_pubkey58()  { [[ "$1" =~ ^[1-9A-HJ-NP-Za-km-z]{32,44}$ ]] || return 1; }
check_dsn()       { [[ "$1" =~ ^postgres(ql)?:// ]] || return 1; }

run_backend() {
  section "Backend deploy env (backend/.env.deploy)"
  local f="backend/.env.deploy"
  validate_env "$f" \
    NODE_ENV \
    PORT \
    FRONTEND_URL \
    DATABASE_URL \
    SOLANA_PROGRAM_ID \
    PRIVY_APP_ID \
    PRIVY_APP_SECRET

  # Format checks for the load-bearing values.
  if [ -f "$f" ]; then
    local frontend_url; frontend_url=$(grep -E '^FRONTEND_URL=' "$f" | cut -d= -f2-)
    if check_url "$frontend_url"; then ok "FRONTEND_URL is a URL"; else fail "FRONTEND_URL not a URL: $frontend_url"; fi

    local dsn; dsn=$(grep -E '^DATABASE_URL=' "$f" | cut -d= -f2-)
    if check_dsn "$dsn"; then ok "DATABASE_URL looks like postgres://"; else fail "DATABASE_URL not postgres://: ${dsn:0:20}..."; fi

    local pid; pid=$(grep -E '^SOLANA_PROGRAM_ID=' "$f" | cut -d= -f2-)
    if check_pubkey58 "$pid"; then ok "SOLANA_PROGRAM_ID is base58"; else fail "SOLANA_PROGRAM_ID not base58: $pid"; fi

    # Hard rule check: CLOAK flag must NOT be true on devnet deploys without
    # the v2 cron verifier (see docs/SUBMISSION_RISKS.md R2).
    local cloak; cloak=$(grep -E '^ENABLE_CLOAK_MAINNET=' "$f" | cut -d= -f2- || echo "false")
    case "$cloak" in
      true|"true"|1) fail "ENABLE_CLOAK_MAINNET=true without v2 cron — see SUBMISSION_RISKS.md R2" ;;
      *)             ok "ENABLE_CLOAK_MAINNET disabled (correct for submission)" ;;
    esac
  fi
}

run_frontend() {
  section "Frontend deploy env (frontend/.env.deploy)"
  local f="frontend/.env.deploy"
  validate_env "$f" \
    NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_DEMO_MODE \
    NEXT_PUBLIC_PRIVY_APP_ID \
    NEXT_PUBLIC_SOLANA_PROGRAM_ID

  if [ -f "$f" ]; then
    local api_url; api_url=$(grep -E '^NEXT_PUBLIC_API_URL=' "$f" | cut -d= -f2-)
    if check_url "$api_url"; then
      if [[ "$api_url" =~ localhost ]]; then
        fail "NEXT_PUBLIC_API_URL points to localhost — Vercel can't reach this"
      else
        ok "NEXT_PUBLIC_API_URL is a real URL"
      fi
    else
      fail "NEXT_PUBLIC_API_URL not a URL: $api_url"
    fi

    local pid; pid=$(grep -E '^NEXT_PUBLIC_SOLANA_PROGRAM_ID=' "$f" | cut -d= -f2-)
    if check_pubkey58 "$pid"; then ok "NEXT_PUBLIC_SOLANA_PROGRAM_ID is base58"; else fail "NEXT_PUBLIC_SOLANA_PROGRAM_ID not base58"; fi

    local demo; demo=$(grep -E '^NEXT_PUBLIC_DEMO_MODE=' "$f" | cut -d= -f2-)
    if [ "$demo" = "true" ]; then
      fail "NEXT_PUBLIC_DEMO_MODE=true on a real deploy bypasses Privy auth — set false"
    else
      ok "NEXT_PUBLIC_DEMO_MODE disabled (real Privy required)"
    fi

    local cloak; cloak=$(grep -E '^NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=' "$f" | cut -d= -f2- || echo "false")
    case "$cloak" in
      true|"true"|1) fail "NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=true on devnet — Cloak program is mainnet-only" ;;
      *)             ok "NEXT_PUBLIC_ENABLE_CLOAK_MAINNET disabled (correct for devnet)" ;;
    esac
  fi
}

run_smoke() {
  local url="${1:-}"
  if [ -z "$url" ]; then echo "usage: preflight-deploy.sh smoke <https://...>"; exit 2; fi
  section "Deployed backend smoke ($url)"

  local health
  health=$(curl -s -o /tmp/sorts-health.json -w "%{http_code}" "$url/health" || echo "000")
  if [ "$health" = "200" ]; then
    ok "/health returned 200"
    local body; body=$(cat /tmp/sorts-health.json)
    echo "    body: $body"
  else
    fail "/health returned $health"
  fi

  local communities
  communities=$(curl -s -o /tmp/sorts-comms.json -w "%{http_code}" "$url/api/communities" || echo "000")
  if [ "$communities" = "200" ]; then
    ok "/api/communities returned 200"
    # Privacy assertion: the response must not contain a wallet-shaped string
    # at the top level outside the documented `creator_wallet` field.
    if grep -qE '"members":\[' /tmp/sorts-comms.json; then
      fail "/api/communities response contains a `members` array — privacy regression"
    else
      ok "no `members` array in response"
    fi
  else
    fail "/api/communities returned $communities"
  fi
}

case "$mode" in
  local)    run_local ;;
  backend)  run_backend ;;
  frontend) run_frontend ;;
  smoke)    shift || true; run_smoke "${1:-}" ;;
  all)
    run_local
    [ -f backend/.env.deploy ]  && run_backend  || warn "skip backend env (no backend/.env.deploy yet)"
    [ -f frontend/.env.deploy ] && run_frontend || warn "skip frontend env (no frontend/.env.deploy yet)"
    ;;
  *)        echo "modes: local | backend | frontend | smoke <url> | all"; exit 2 ;;
esac

echo
if [ "$FAILED" -ne 0 ]; then
  echo -e "${RED}preflight FAILED${NC} — fix the items above before deploying."
  exit 1
fi
echo -e "${GREEN}preflight PASSED${NC} — ready to deploy."
exit 0
