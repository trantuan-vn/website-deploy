#!/usr/bin/env bash
# redeploy-oke.sh — Build, push image và rollout sau khi sửa code.
#
# Dùng sau lần deploy đầu tiên (Ingress, TLS, Mongo đã có sẵn).
#
# Usage:
#   ./scripts/redeploy-oke.sh                    # dùng IMAGE_TAG trong production.env
#   IMAGE_TAG=v1.0.2 ./scripts/redeploy-oke.sh   # tag mới
#   ./scripts/redeploy-oke.sh --skip-connect     # kubectl đã kết nối
#
# Xem docs/DEPLOY-OKE-CLOUDFLARE.md mục 5.6

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec "$SCRIPT_DIR/deploy-oke.sh" \
  --skip-mongo \
  --skip-ingress \
  --skip-tls \
  --skip-cron \
  "$@"
