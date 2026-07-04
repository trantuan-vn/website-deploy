#!/usr/bin/env bash
# test-local.sh — Khởi động stack Docker dev và chạy smoke test local.
#
# Usage:
#   ./scripts/test-local.sh                 # up + đợi ready + smoke test
#   ./scripts/test-local.sh --check         # chỉ smoke test (stack đã chạy)
#   ./scripts/test-local.sh --up            # chỉ khởi động stack
#   ./scripts/test-local.sh --down          # dừng stack
#   ./scripts/test-local.sh --seed-ccp      # up + seed CCP + smoke test
#   ./scripts/test-local.sh --logs          # tail log payload-dev
#   ./scripts/test-local.sh --help
#
# Tuỳ chọn env:
#   BASE_URL=http://localhost:3000
#   WAIT_TIMEOUT=600          # giây (dev:admin build có thể ~1–2 phút)
#   LOCAL_ADMIN_EMAIL=...     # nếu set, test POST /api/users/login
#   LOCAL_ADMIN_PASSWORD=...

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

COMPOSE=(docker compose -f "$REPO_ROOT/docker-compose.prod.yml" -f "$REPO_ROOT/docker-compose.dev.yml")
COMPOSE_SEED=(docker compose -f "$REPO_ROOT/docker-compose.prod.yml" -f "$REPO_ROOT/docker-compose.seed.yml")

BASE_URL="${BASE_URL:-http://localhost:3000}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-600}"
LOCAL_ADMIN_EMAIL="${LOCAL_ADMIN_EMAIL:-}"
LOCAL_ADMIN_PASSWORD="${LOCAL_ADMIN_PASSWORD:-}"

DO_UP=true
DO_CHECK=true
DO_DOWN=false
DO_SEED=false
DO_LOGS=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_step() { echo -e "\n${BLUE}==>${NC} $1"; }
log_ok()   { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_err()  { echo -e "${RED}✗${NC} $1" >&2; }

usage() {
  sed -n '2,16p' "$0" | sed 's/^# \?//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --up)        DO_UP=true; DO_CHECK=false; DO_DOWN=false ;;
    --check)     DO_UP=false; DO_CHECK=true; DO_DOWN=false ;;
    --down)      DO_UP=false; DO_CHECK=false; DO_DOWN=true ;;
    --seed-ccp)  DO_SEED=true ;;
    --logs)      DO_LOGS=true; DO_UP=false; DO_CHECK=false; DO_DOWN=false ;;
    --no-start)  DO_UP=false ;;
    -h|--help)   usage; exit 0 ;;
    *) log_err "Unknown option: $1"; usage; exit 1 ;;
  esac
  shift
done

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log_err "Missing command: $1"
    exit 1
  fi
}

require_env_file() {
  if [[ ! -f "$REPO_ROOT/.env" ]]; then
    log_err "Missing .env — copy .env.example → .env and set PAYLOAD_SECRET, DATABASE_URL, ..."
    exit 1
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local elapsed=0
  local interval=5

  log_step "Đợi $label (timeout ${WAIT_TIMEOUT}s)..."
  while [[ "$elapsed" -lt "$WAIT_TIMEOUT" ]]; do
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
    if [[ "$code" == "200" ]]; then
      log_ok "$label ready (${elapsed}s) — HTTP $code"
      return 0
    fi
    if (( elapsed > 0 && elapsed % 30 == 0 )); then
      echo "  ... ${elapsed}s — HTTP ${code:-000}"
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  log_err "Timeout waiting for $label ($url)"
  return 1
}

http_status() {
  curl -s -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || echo "000"
}

assert_status() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local code
  code="$(http_status "$url")"

  if [[ "$code" == "$expected" ]]; then
    log_ok "$name — HTTP $code"
    return 0
  fi

  log_err "$name — expected HTTP $expected, got $code ($url)"
  return 1
}

check_runtime_errors() {
  local container="${1:-website-deploy-payload-dev-1}"
  if ! docker ps --format '{{.Names}}' | grep -qx "$container"; then
    log_warn "Container $container not running — skip log scan"
    return 0
  fi

  if docker logs "$container" 2>&1 | rg -qi 'enqueueModel is not a function|chunk\.reason\.enqueueModel'; then
    log_err "Detected enqueueModel error in container logs (Turbopack RSC bug)"
    log_warn "Use docker-compose.dev.yml with pnpm dev:admin, not pnpm dev"
    return 1
  fi

  log_ok "No enqueueModel errors in recent container logs"
}

run_smoke_tests() {
  local failed=0

  log_step "Smoke test — $BASE_URL"

  assert_status "Admin login page" "$BASE_URL/admin/login" "200" || failed=1
  assert_status "Home page" "$BASE_URL/" "200" || failed=1
  assert_status "Posts index" "$BASE_URL/posts" "200" || failed=1
  assert_status "Search page" "$BASE_URL/search" "200" || failed=1

  local me_code
  me_code="$(http_status "$BASE_URL/api/users/me")"
  if [[ "$me_code" == "401" || "$me_code" == "200" ]]; then
    log_ok "API /api/users/me — HTTP $me_code"
  else
    log_err "API /api/users/me — expected 401 or 200, got $me_code"
    failed=1
  fi

  if [[ -n "$LOCAL_ADMIN_EMAIL" && -n "$LOCAL_ADMIN_PASSWORD" ]]; then
    log_step "Admin login API"
    local login_code
    login_code="$(
      curl -s -o /dev/null -w '%{http_code}' \
        -X POST "$BASE_URL/api/users/login" \
        -H 'Content-Type: application/json' \
        -d "{\"email\":\"$LOCAL_ADMIN_EMAIL\",\"password\":\"$LOCAL_ADMIN_PASSWORD\"}" \
        2>/dev/null || echo "000"
    )"
    if [[ "$login_code" == "200" ]]; then
      log_ok "POST /api/users/login — HTTP $login_code"
      assert_status "Admin dashboard (cookie session may be required in browser)" "$BASE_URL/admin" "200" || failed=1
    else
      log_err "POST /api/users/login — expected HTTP 200, got $login_code"
      failed=1
    fi
  else
    log_warn "Skip login test — set LOCAL_ADMIN_EMAIL + LOCAL_ADMIN_PASSWORD to enable"
  fi

  check_runtime_errors || failed=1

  if [[ "$failed" -ne 0 ]]; then
    log_err "Smoke test failed"
    exit 1
  fi

  log_ok "All smoke tests passed"
  echo ""
  echo "  Admin:    $BASE_URL/admin"
  echo "  Frontend: $BASE_URL/"
}

start_stack() {
  require_env_file
  log_step "Khởi động mongo + payload-dev"
  "${COMPOSE[@]}" up -d mongo payload-dev
  wait_for_url "$BASE_URL/admin/login" "payload-dev"
}

stop_stack() {
  log_step "Dừng stack dev"
  "${COMPOSE[@]}" stop payload-dev mongo 2>/dev/null || true
  log_ok "Stopped payload-dev + mongo"
}

seed_ccp() {
  require_env_file
  log_step "Seed CCP data"
  "${COMPOSE_SEED[@]}" run --rm seed-ccp
  log_ok "Seed CCP completed"
}

show_logs() {
  docker logs -f website-deploy-payload-dev-1
}

main() {
  require_command docker
  require_command curl

  if [[ "$DO_LOGS" == true ]]; then
    show_logs
    exit 0
  fi

  if [[ "$DO_DOWN" == true ]]; then
    stop_stack
    exit 0
  fi

  if [[ "$DO_UP" == true ]]; then
    start_stack
  fi

  if [[ "$DO_SEED" == true ]]; then
    seed_ccp
  fi

  if [[ "$DO_CHECK" == true ]]; then
    run_smoke_tests
  fi
}

main "$@"
