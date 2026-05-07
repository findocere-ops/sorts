#!/usr/bin/env bash
# scripts/local-demo.sh
#
# Brings up the SORTS demo stack against a local solana-test-validator.
# Used as the backup recording target if devnet flakes (see
# docs/INCIDENT_RESPONSE.md S1 + docs/DEMO_RECORDING_PLAN.md).
#
# Idempotent. Safe to re-run; it will reset the validator ledger every
# time. The frontend + backend env files are NEVER touched by this
# script — the operator points them at localhost manually per the
# matrix in DEMO_RECORDING_PLAN.md.
#
# Usage:
#   scripts/local-demo.sh up          # start validator + tail logs
#   scripts/local-demo.sh status      # check validator + program
#   scripts/local-demo.sh down        # stop validator
#   scripts/local-demo.sh airdrop <PUBKEY> [SOL]   # fund a wallet

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRAM_SO="$REPO_ROOT/programs/sorts-community/target/deploy/sorts_community.so"
PROGRAM_ID="AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV"
LEDGER_DIR="/tmp/sorts-test-ledger"
PID_FILE="/tmp/sorts-validator.pid"
LOCAL_RPC="http://localhost:8899"

log()  { printf '[local-demo] %s\n' "$*"; }
die()  { printf '[local-demo] ERROR: %s\n' "$*" >&2; exit 1; }

require_artifacts() {
  [ -f "$PROGRAM_SO" ] || die "program artifact missing at $PROGRAM_SO. Run \`cargo build-sbf\` in programs/sorts-community first."
  command -v solana-test-validator >/dev/null 2>&1 || \
    die "solana-test-validator not on PATH. Install Solana CLI from https://docs.solana.com/cli/install-solana-cli-tools"
}

cmd_up() {
  require_artifacts
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    log "validator already running (pid $(cat "$PID_FILE")). Use 'down' first."
    exit 0
  fi

  log "starting validator with program $PROGRAM_ID at $LOCAL_RPC"
  log "ledger: $LEDGER_DIR (will be reset)"
  rm -rf "$LEDGER_DIR"

  nohup solana-test-validator \
    --reset \
    --quiet \
    --bpf-program "$PROGRAM_ID" "$PROGRAM_SO" \
    --ledger "$LEDGER_DIR" \
    > /tmp/sorts-validator.log 2>&1 &
  echo $! > "$PID_FILE"
  log "started; pid $(cat "$PID_FILE"), log /tmp/sorts-validator.log"

  log "waiting for RPC to become reachable..."
  for i in $(seq 1 30); do
    if solana cluster-version --url "$LOCAL_RPC" >/dev/null 2>&1; then
      log "RPC up after ${i}s"
      cmd_status
      log ""
      log "Next steps:"
      log "  1. Set frontend NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL=$LOCAL_RPC in frontend/.env.local"
      log "  2. Set backend SOLANA_DEVNET_RPC_URL=$LOCAL_RPC in backend/.env"
      log "  3. Airdrop test wallet:  scripts/local-demo.sh airdrop <YOUR_WALLET> 5"
      log "  4. Restart frontend + backend dev servers."
      log "  5. Record demo per docs/DEMO_RECORDING_PLAN.md."
      log ""
      log "When done:  scripts/local-demo.sh down"
      return 0
    fi
    sleep 1
  done
  die "validator did not respond within 30s. Check /tmp/sorts-validator.log"
}

cmd_status() {
  if ! solana cluster-version --url "$LOCAL_RPC" >/dev/null 2>&1; then
    die "validator not reachable at $LOCAL_RPC"
  fi
  log "RPC: $LOCAL_RPC ($(solana cluster-version --url "$LOCAL_RPC"))"
  log "program $PROGRAM_ID:"
  solana program show "$PROGRAM_ID" --url "$LOCAL_RPC" 2>&1 | sed 's/^/    /'
}

cmd_down() {
  if [ ! -f "$PID_FILE" ]; then
    log "no pidfile — validator not managed by this script. Stop manually if running."
    return 0
  fi
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    log "stopping pid $PID"
    kill "$PID"
    sleep 2
    if kill -0 "$PID" 2>/dev/null; then
      log "still alive after SIGTERM; sending SIGKILL"
      kill -9 "$PID" 2>/dev/null || true
    fi
  fi
  rm -f "$PID_FILE"
  log "stopped."
}

cmd_airdrop() {
  local target="${1:-}"
  local sol="${2:-5}"
  [ -n "$target" ] || die "usage: scripts/local-demo.sh airdrop <PUBKEY> [SOL]"
  log "airdropping ${sol} SOL to $target"
  solana airdrop "$sol" "$target" --url "$LOCAL_RPC"
}

case "${1:-}" in
  up)        cmd_up ;;
  status)    cmd_status ;;
  down)      cmd_down ;;
  airdrop)   shift; cmd_airdrop "$@" ;;
  *)
    cat <<USAGE
scripts/local-demo.sh — backup demo target

Commands:
  up                       Start solana-test-validator with the SORTS program preloaded.
  status                   Verify the validator is running and the program is at the expected id.
  down                     Stop the validator.
  airdrop <PUBKEY> [SOL]   Fund a wallet on the local validator (default 5 SOL).
USAGE
    exit 1
    ;;
esac
