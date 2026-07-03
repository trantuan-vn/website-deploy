#!/usr/bin/env bash
# deploy-oke.sh — Triển khai website-deploy lên OKE theo docs/DEPLOY-OKE-CLOUDFLARE.md
#
# Thứ tự:
#   1. Kết nối kubectl qua Bastion
#   2. Deploy MongoDB (in-cluster, tùy chọn)
#   3. Build + push Docker image lên OCIR
#   4. Tạo ocir-secret
#   5. Apply k8s manifests (namespace, secret, configmap, pvc, deployment, service)
#   6. Cài NGINX Ingress Controller (nếu chưa có)
#   7. Tạo TLS secret (Cloudflare Origin Certificate)
#   8. Apply Ingress
#   9. In public IP Load Balancer + hướng dẫn Cloudflare
#  10. Apply CronJob (scheduled publish)
#  11. Kiểm tra sau triển khai
#
# Cấu hình: copy scripts/deploy-oke.env.example → production.env (repo root)
#
# Usage:
#   ./scripts/deploy-oke.sh              # deploy đầy đủ
#   ./scripts/deploy-oke.sh --skip-build # bỏ qua docker build/push
#   ./scripts/deploy-oke.sh --help

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BASTION_DIR="$SCRIPT_DIR/bastion"
K8S_DIR="$REPO_ROOT/k8s"
INGRESS_MANIFEST="https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/cloud/deploy.yaml"

# --- defaults (override via production.env) ---
OCIR_REGION="${OCIR_REGION:-ap-singapore-1}"
DOMAIN="${DOMAIN:-vccp.vn}"
NEXT_PUBLIC_SERVER_URL="${NEXT_PUBLIC_SERVER_URL:-https://vccp.vn}"
IMAGE_TAG="${IMAGE_TAG:-v1.0.0}"
ORIGIN_CERT="${ORIGIN_CERT:-origin.pem}"
ORIGIN_KEY="${ORIGIN_KEY:-origin.key}"
DEPLOY_MONGO="${DEPLOY_MONGO:-true}"

SKIP_CONNECT=false
SKIP_MONGO=false
SKIP_BUILD=false
SKIP_PUSH=false
SKIP_INGRESS=false
SKIP_TLS=false
SKIP_CRON=false
SKIP_VERIFY=false
DRY_RUN=false
MONGO_PF_PID=""
MONGO_LOCAL_STARTED=false

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
  sed -n '2,22p' "$0" | sed 's/^# \?//'
  echo ""
  echo "Options:"
  echo "  --skip-connect   Bỏ qua connect-oke.sh (kubectl đã kết nối)"
  echo "  --skip-mongo     Bỏ qua deploy MongoDB in-cluster"
  echo "  --skip-build     Bỏ qua docker build"
  echo "  --skip-push      Bỏ qua docker push"
  echo "  --skip-ingress   Bỏ qua cài NGINX Ingress Controller"
  echo "  --skip-tls       Bỏ qua tạo secret TLS"
  echo "  --skip-cron      Bỏ qua CronJob scheduled publish"
  echo "  --skip-verify    Bỏ qua bước kiểm tra cuối"
  echo "  --dry-run        In lệnh sẽ chạy, không thực thi"
  echo "  -h, --help       Hiển thị trợ giúp"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-connect) SKIP_CONNECT=true ;;
    --skip-mongo)   SKIP_MONGO=true; DEPLOY_MONGO=false ;;
    --skip-build)   SKIP_BUILD=true ;;
    --skip-push)    SKIP_PUSH=true ;;
    --skip-ingress) SKIP_INGRESS=true ;;
    --skip-tls)     SKIP_TLS=true ;;
    --skip-cron)    SKIP_CRON=true ;;
    --skip-verify)  SKIP_VERIFY=true ;;
    --dry-run)      DRY_RUN=true ;;
    -h|--help)      usage; exit 0 ;;
    *) log_err "Unknown option: $1"; usage; exit 1 ;;
  esac
  shift
done

run() {
  if [[ "$DRY_RUN" == true ]]; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

require_cmd() {
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      log_err "Thiếu lệnh bắt buộc: $cmd"
      exit 1
    fi
  done
}

load_env() {
  local env_file="$REPO_ROOT/production.env"

  # Đọc giá trị từ .env không qua shell expansion (tránh ; [ ] $ … làm hỏng token)
  env_file_val() {
    local key="$1" file="$2" line val
    line=$(grep -E "^${key}=" "$file" | tail -1) || return 1
    val="${line#*=}"
    if [[ "$val" == \"*\" && "$val" == *\" ]]; then val="${val:1:-1}"; fi
    if [[ "$val" == \'*\' && "$val" == *\' ]]; then val="${val:1:-1}"; fi
    printf '%s' "$val"
  }

  if [[ -f "$env_file" ]]; then
    # shellcheck disable=SC1090
    set -a
    source "$env_file"
    set +a
    # Token/secret có thể chứa ký tự đặc biệt — đọc lại an toàn sau source
    OCIR_AUTH_TOKEN=$(env_file_val OCIR_AUTH_TOKEN "$env_file") || true
    log_ok "Đã load $env_file"
  else
    log_warn "Không tìm thấy production.env — dùng biến môi trường hoặc default"
    log_warn "Tạo file: cp scripts/deploy-oke.env.example production.env"
  fi

  : "${OCIR_TENANCY_NAMESPACE:?Set OCIR_TENANCY_NAMESPACE in production.env}"
  : "${OCIR_USERNAME:?Set OCIR_USERNAME in production.env}"
  : "${OCIR_AUTH_TOKEN:?Set OCIR_AUTH_TOKEN in production.env}"
  : "${DATABASE_URL:?Set DATABASE_URL in production.env}"
  : "${PAYLOAD_SECRET:?Set PAYLOAD_SECRET in production.env}"
  : "${CRON_SECRET:?Set CRON_SECRET in production.env}"
  : "${PREVIEW_SECRET:?Set PREVIEW_SECRET in production.env}"

  if command -v oci &>/dev/null; then
    local oci_ns
    oci_ns=$(oci os ns get --query 'data' --raw-output 2>/dev/null || true)
    if [[ -n "$oci_ns" && "$oci_ns" != "$OCIR_TENANCY_NAMESPACE" ]]; then
      log_warn "OCIR_TENANCY_NAMESPACE=$OCIR_TENANCY_NAMESPACE ≠ OCI ($oci_ns) — dùng $oci_ns"
      OCIR_TENANCY_NAMESPACE="$oci_ns"
    fi
  fi

  OCIR_REGISTRY="${OCIR_REGION}.ocir.io"
  OCIR_IMAGE="${OCIR_REGISTRY}/${OCIR_TENANCY_NAMESPACE}/website-deploy:${IMAGE_TAG}"
  OCIR_DOCKER_USER="${OCIR_TENANCY_NAMESPACE}/${OCIR_USERNAME}"

  BUILD_DATABASE_URL="${BUILD_DATABASE_URL:-$DATABASE_URL}"
  BUILD_PAYLOAD_SECRET="${BUILD_PAYLOAD_SECRET:-$PAYLOAD_SECRET}"
  NEXT_PUBLIC_SERVER_URL="${NEXT_PUBLIC_SERVER_URL:-https://${DOMAIN}}"
  OCIR_EMAIL="${OCIR_EMAIL:-${OCIR_USERNAME}@localhost}"
}

resolve_docker_platform() {
  if [[ -n "${DOCKER_PLATFORM:-}" ]]; then
    log_ok "Docker platform: $DOCKER_PLATFORM (từ production.env)"
    return
  fi
  local arch
  arch=$(kubectl get nodes -o jsonpath='{.items[0].status.nodeInfo.architecture}' 2>/dev/null || true)
  case "$arch" in
    arm64) DOCKER_PLATFORM=linux/arm64 ;;
    amd64) DOCKER_PLATFORM=linux/amd64 ;;
    *)
      DOCKER_PLATFORM=linux/arm64
      log_warn "Không detect node arch — mặc định $DOCKER_PLATFORM"
      return
      ;;
  esac
  log_ok "Docker platform: $DOCKER_PLATFORM (từ OKE node arch: $arch)"
}

render_template() {
  local src="$1"
  local dest="$2"
  export OCIR_IMAGE DOMAIN NEXT_PUBLIC_SERVER_URL
  envsubst '${OCIR_IMAGE} ${DOMAIN} ${NEXT_PUBLIC_SERVER_URL}' <"$src" >"$dest"
}

# --- Step 1: Connect OKE ---
step_connect_oke() {
  log_step "[1/11] Kết nối kubectl tới OKE qua Bastion"
  if [[ "$SKIP_CONNECT" == true ]]; then
    log_warn "Bỏ qua connect-oke.sh"
    return
  fi
  if [[ ! -x "$BASTION_DIR/connect-oke.sh" ]]; then
    log_err "Không tìm thấy $BASTION_DIR/connect-oke.sh"
    exit 1
  fi
  run bash "$BASTION_DIR/connect-oke.sh"
  run kubectl get nodes
}

# --- Step 2: MongoDB ---
step_deploy_mongo() {
  log_step "[2/11] Chuẩn bị MongoDB"
  if [[ "$SKIP_MONGO" == true || "$DEPLOY_MONGO" != true ]]; then
    log_warn "Bỏ qua MongoDB in-cluster (dùng DATABASE_URL bên ngoài)"
    return
  fi
  run kubectl apply -f "$K8S_DIR/namespace.yaml"
  run kubectl apply -f "$K8S_DIR/mongo.yaml"
  log_ok "MongoDB StatefulSet đã apply — đợi pod ready..."
  if [[ "$DRY_RUN" != true ]]; then
    # StatefulSet không tự recreate pod khi đổi image — xóa pod lỗi/cũ để tạo lại.
    if ! kubectl wait --for=condition=ready pod -l app=mongo -n website --timeout=30s 2>/dev/null; then
      log_warn "Mongo pod chưa ready — xóa pod để StatefulSet tạo lại (image mới)..."
      kubectl delete pod -l app=mongo -n website --wait=false 2>/dev/null || true
    fi
    if ! kubectl wait --for=condition=ready pod -l app=mongo -n website --timeout=600s 2>/dev/null; then
      log_err "MongoDB chưa ready — kiểm tra: kubectl get pods -n website -l app=mongo"
      kubectl describe pod -n website -l app=mongo 2>/dev/null | tail -20 || true
      if [[ "$SKIP_BUILD" != true ]]; then
        exit 1
      fi
    fi
  fi
}

verify_build_mongo_connection() {
  local i=0 platform="${DOCKER_PLATFORM:-linux/arm64}"
  while [[ $i -lt 30 ]]; do
    if docker run --rm --platform "$platform" docker.io/library/mongo:7 \
        mongosh "$BUILD_DATABASE_URL" --quiet --eval 'db.adminCommand({ping:1}).ok' 2>/dev/null \
        | grep -q 1; then
      log_ok "Mongo reachable từ Docker build container"
      return 0
    fi
    sleep 2
    i=$((i + 1))
  done
  return 1
}

mongo_port_forward_start() {
  if [[ "$SKIP_BUILD" == true || "$DRY_RUN" == true ]]; then
    return 1
  fi
  if [[ "$BUILD_DATABASE_URL" != *"host.docker.internal"* && "$BUILD_DATABASE_URL" != *"127.0.0.1"* ]]; then
    return 1
  fi
  if ! kubectl get svc mongo -n website &>/dev/null; then
    return 1
  fi
  if ! kubectl wait --for=condition=ready pod -l app=mongo -n website --timeout=120s &>/dev/null; then
    log_warn "Mongo pod trên cluster chưa ready"
    return 1
  fi
  log_ok "Port-forward MongoDB 0.0.0.0:27017 (cho docker build qua host.docker.internal)..."
  # Giữ port-forward sống trong suốt docker build (build có thể > 5 phút).
  (
    while true; do
      kubectl port-forward --address 0.0.0.0 -n website svc/mongo 27017:27017
      sleep 2
    done
  ) &>/dev/null &
  MONGO_PF_PID=$!
  local i=0
  while [[ $i -lt 30 ]]; do
    if nc -z 127.0.0.1 27017 2>/dev/null; then
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done
  mongo_port_forward_stop
  return 1
}

start_local_build_mongo() {
  log_ok "Khởi động Mongo local (docker compose) cho docker build..."
  docker compose -f "$REPO_ROOT/docker-compose.yml" up -d mongo
  MONGO_LOCAL_STARTED=true
  local i=0
  while [[ $i -lt 30 ]]; do
    if nc -z 127.0.0.1 27017 2>/dev/null; then
      return 0
    fi
    sleep 2
    i=$((i + 1))
  done
  return 1
}

ensure_build_mongo() {
  if [[ "$SKIP_BUILD" == true || "$DRY_RUN" == true ]]; then
    return
  fi
  if [[ "$BUILD_DATABASE_URL" != *"host.docker.internal"* && "$BUILD_DATABASE_URL" != *"127.0.0.1"* ]]; then
    return
  fi

  if mongo_port_forward_start && verify_build_mongo_connection; then
    return
  fi

  log_warn "Cluster Mongo không reach được — thử Mongo local..."
  mongo_port_forward_stop
  if start_local_build_mongo && verify_build_mongo_connection; then
    return
  fi

  log_warn "Mongo không reachable tại $BUILD_DATABASE_URL — build tiếp tục (không pre-render trang từ DB)"
  log_warn "Để pre-render đầy đủ: ./scripts/bastion/connect-oke.sh hoặc docker compose up -d mongo"
  mongo_port_forward_stop
}

mongo_port_forward_stop() {
  if [[ -n "$MONGO_PF_PID" ]]; then
    kill "$MONGO_PF_PID" 2>/dev/null || true
    pkill -P "$MONGO_PF_PID" 2>/dev/null || true
    wait "$MONGO_PF_PID" 2>/dev/null || true
    MONGO_PF_PID=""
  fi
  if [[ "$MONGO_LOCAL_STARTED" == true ]]; then
    docker compose -f "$REPO_ROOT/docker-compose.yml" stop mongo &>/dev/null || true
    MONGO_LOCAL_STARTED=false
  fi
}

# --- Step 3 & 4: Build + Push ---
step_build_push_image() {
  log_step "[3/11] Build Docker image"
  if [[ "$SKIP_BUILD" == true ]]; then
    log_warn "Bỏ qua docker build"
  else
    require_cmd docker
    resolve_docker_platform
    ensure_build_mongo
    run docker build \
      --platform "$DOCKER_PLATFORM" \
      --build-arg DATABASE_URL="$BUILD_DATABASE_URL" \
      --build-arg PAYLOAD_SECRET="$BUILD_PAYLOAD_SECRET" \
      --build-arg NEXT_PUBLIC_SERVER_URL="$NEXT_PUBLIC_SERVER_URL" \
      -t "$OCIR_IMAGE" \
      "$REPO_ROOT"
    mongo_port_forward_stop
    log_ok "Build xong: $OCIR_IMAGE"
  fi

  log_step "[4/11] Push Docker image lên OCIR"
  if [[ "$SKIP_PUSH" == true ]]; then
    log_warn "Bỏ qua docker push"
    return
  fi
  require_cmd docker
  if [[ "$DRY_RUN" != true ]]; then
    # Image có thể đã build với namespace cũ trong tên tag
    if ! docker image inspect "$OCIR_IMAGE" &>/dev/null; then
      local alt_image
      alt_image=$(docker images --format '{{.Repository}}:{{.Tag}}' \
        | grep -E '/website-deploy:'"${IMAGE_TAG}"'$' | head -1 || true)
      if [[ -n "$alt_image" && "$alt_image" != "$OCIR_IMAGE" ]]; then
        log_warn "Retag $alt_image → $OCIR_IMAGE"
        docker tag "$alt_image" "$OCIR_IMAGE"
      fi
    fi
    if ! echo "$OCIR_AUTH_TOKEN" | docker login "$OCIR_REGISTRY" \
      -u "$OCIR_DOCKER_USER" \
      --password-stdin; then
      log_err "Docker login OCIR thất bại"
      echo "  Registry:  $OCIR_REGISTRY"
      echo "  Username:  $OCIR_DOCKER_USER  (định dạng: <tenancy-namespace>/<oci-username>)"
      echo "  Namespace: oci os ns get  (không phải tên compartment)"
      exit 1
    fi
  else
    echo "[dry-run] docker login $OCIR_REGISTRY -u $OCIR_DOCKER_USER"
  fi
  run docker push "$OCIR_IMAGE"
  log_ok "Push xong: $OCIR_IMAGE"
}

# --- Step 5: ocir-secret + k8s manifests ---
step_apply_k8s_app() {
  log_step "[5/11] Triển khai ứng dụng lên Kubernetes"

  run kubectl apply -f "$K8S_DIR/namespace.yaml"

  log_ok "Tạo/cập nhật ocir-secret..."
  if [[ "$DRY_RUN" == true ]]; then
    echo "[dry-run] kubectl create secret docker-registry ocir-secret ..."
  else
    kubectl create secret docker-registry ocir-secret \
      --namespace website \
      --docker-server="$OCIR_REGISTRY" \
      --docker-username="$OCIR_DOCKER_USER" \
      --docker-password="$OCIR_AUTH_TOKEN" \
      --docker-email="$OCIR_EMAIL" \
      --dry-run=client -o yaml | kubectl apply -f -
  fi

  log_ok "Tạo/cập nhật website-secrets..."
  if [[ "$DRY_RUN" == true ]]; then
    echo "[dry-run] kubectl create secret generic website-secrets ..."
  else
    kubectl create secret generic website-secrets \
      --namespace website \
      --from-literal=DATABASE_URL="$DATABASE_URL" \
      --from-literal=PAYLOAD_SECRET="$PAYLOAD_SECRET" \
      --from-literal=CRON_SECRET="$CRON_SECRET" \
      --from-literal=PREVIEW_SECRET="$PREVIEW_SECRET" \
      --dry-run=client -o yaml | kubectl apply -f -
  fi

  local tmpdir
  tmpdir="$(mktemp -d)"
  trap '[[ -n "${tmpdir:-}" ]] && rm -rf "$tmpdir"' RETURN

  # ConfigMap với URL production
  cat >"$tmpdir/configmap.yaml" <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: website-config
  namespace: website
data:
  NEXT_PUBLIC_SERVER_URL: "${NEXT_PUBLIC_SERVER_URL}"
EOF
  run kubectl apply -f "$tmpdir/configmap.yaml"

  run kubectl apply -f "$K8S_DIR/pvc-media.yaml"

  render_template "$K8S_DIR/deployment.yaml" "$tmpdir/deployment.yaml"
  run kubectl apply -f "$tmpdir/deployment.yaml"

  run kubectl apply -f "$K8S_DIR/service.yaml"

  log_ok "Đợi deployment rollout..."
  if [[ "$DRY_RUN" != true ]]; then
    kubectl rollout status deployment/website-deploy -n website --timeout=600s \
      || log_warn "Rollout chưa hoàn tất — kiểm tra: kubectl get pods -n website"
  fi
}

# --- Step 6: NGINX Ingress ---
wait_for_ingress_admission() {
  if [[ "$DRY_RUN" == true ]]; then
    return 0
  fi
  log_ok "Đợi Ingress admission webhook ready..."
  local i=0
  while [[ $i -lt 60 ]]; do
    if kubectl get endpoints -n ingress-nginx ingress-nginx-controller-admission \
        -o jsonpath='{.subsets[0].addresses[0].ip}' 2>/dev/null | grep -q .; then
      return 0
    fi
    sleep 5
    i=$((i + 1))
  done
  log_err "Admission webhook chưa có endpoints — kiểm tra: kubectl get pods -n ingress-nginx"
  return 1
}

step_install_ingress() {
  log_step "[6/11] Cài NGINX Ingress Controller"
  if [[ "$SKIP_INGRESS" == true ]]; then
    log_warn "Bỏ qua cài Ingress Controller"
    return
  fi
  if [[ "$DRY_RUN" != true ]] && kubectl get deployment -n ingress-nginx ingress-nginx-controller >/dev/null 2>&1; then
    log_ok "NGINX Ingress Controller đã cài — bỏ qua install"
  else
    run kubectl apply -f "$INGRESS_MANIFEST"
    log_ok "Đợi Ingress Controller ready..."
    if [[ "$DRY_RUN" != true ]]; then
      kubectl wait --namespace ingress-nginx \
        --for=condition=available deployment/ingress-nginx-controller \
        --timeout=300s 2>/dev/null \
        || log_warn "Ingress Controller chưa ready — kiểm tra: kubectl get pods -n ingress-nginx"
    fi
  fi
  wait_for_ingress_admission || exit 1
}

# --- Step 7: TLS secret ---
step_create_tls_secret() {
  log_step "[7/11] Cấu hình TLS (Cloudflare Origin Certificate)"
  if [[ "$SKIP_TLS" == true ]]; then
    log_warn "Bỏ qua TLS secret"
    return
  fi
  local cert_path="$REPO_ROOT/$ORIGIN_CERT"
  local key_path="$REPO_ROOT/$ORIGIN_KEY"
  if [[ ! -f "$cert_path" || ! -f "$key_path" ]]; then
    log_warn "Không tìm thấy $cert_path hoặc $key_path"
    log_warn "Tạo Origin Certificate trên Cloudflare (SSL/TLS → Origin Server) rồi chạy lại với --skip-connect --skip-build --skip-push --skip-mongo"
    log_warn "Hoặc đặt file cert/key vào repo root và chạy lại."
    return
  fi
  if [[ "$DRY_RUN" == true ]]; then
    echo "[dry-run] kubectl create secret tls website-tls ..."
  else
    kubectl create secret tls website-tls \
      --namespace website \
      --cert="$cert_path" \
      --key="$key_path" \
      --dry-run=client -o yaml | kubectl apply -f -
  fi
  log_ok "TLS secret website-tls đã apply"
}

# --- Step 8: Ingress ---
step_apply_ingress() {
  log_step "[8/11] Apply Ingress"
  wait_for_ingress_admission || exit 1
  local tmpdir
  tmpdir="$(mktemp -d)"
  trap '[[ -n "${tmpdir:-}" ]] && rm -rf "$tmpdir"' RETURN

  render_template "$K8S_DIR/ingress.yaml" "$tmpdir/ingress.yaml"
  run kubectl apply -f "$tmpdir/ingress.yaml"
  log_ok "Ingress website-ingress đã apply"
}

# --- Step 9: LB IP + Cloudflare instructions ---
step_print_cloudflare_instructions() {
  log_step "[9/11] Lấy public IP Load Balancer"
  local lb_ip=""
  if [[ "$DRY_RUN" != true ]]; then
    echo "Đợi EXTERNAL-IP (có thể mất 2–5 phút)..."
    for _ in $(seq 1 30); do
      lb_ip=$(kubectl get svc -n ingress-nginx ingress-nginx-controller \
        -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
      [[ -n "$lb_ip" && "$lb_ip" != "<pending>" ]] && break
      sleep 10
    done
  else
    lb_ip="<EXTERNAL-IP>"
  fi

  if [[ -z "$lb_ip" || "$lb_ip" == "<pending>" ]]; then
    log_warn "EXTERNAL-IP chưa sẵn sàng. Chạy sau:"
    echo "  kubectl get svc -n ingress-nginx ingress-nginx-controller"
  else
    log_ok "Load Balancer IP: $lb_ip"
  fi

  echo ""
  echo -e "${YELLOW}--- Cấu hình Cloudflare (thủ công) ---${NC}"
  echo ""
  echo "10. DNS Records (Cloudflare → $DOMAIN → DNS):"
  echo "    A    @     ${lb_ip:-<EXTERNAL-IP>}    Proxied (cam)"
  echo "    CNAME www  $DOMAIN                   Proxied"
  echo ""
  echo "11. SSL/TLS:"
  echo "    - Encryption mode: Full (strict)"
  echo "    - Always Use HTTPS: On"
  echo "    - Minimum TLS: 1.2"
  echo ""
  echo "    Cache Rules (theo thứ tự):"
  echo "    - Bypass: URI Path contains /admin"
  echo "    - Bypass: URI Path contains /api/"
  echo "    - Cache: URI Path starts with /_next/static/ (Edge TTL 1 month)"
  echo ""
  echo "    Network → WebSockets: On"
  echo ""
  echo "    Redirect Rule: www.$DOMAIN → https://$DOMAIN\${uri.path} (301)"
}

# --- Step 10: CronJob ---
step_apply_cronjob() {
  log_step "[10/11] CronJob scheduled publish"
  if [[ "$SKIP_CRON" == true ]]; then
    log_warn "Bỏ qua CronJob"
    return
  fi
  local tmpdir
  tmpdir="$(mktemp -d)"
  trap '[[ -n "${tmpdir:-}" ]] && rm -rf "$tmpdir"' RETURN
  render_template "$K8S_DIR/cronjob.yaml" "$tmpdir/cronjob.yaml"
  run kubectl apply -f "$tmpdir/cronjob.yaml"
  log_ok "CronJob payload-cron đã apply"
}

# --- Step 11: Verify ---
step_verify() {
  log_step "[11/11] Kiểm tra sau triển khai"
  if [[ "$SKIP_VERIFY" == true ]]; then
    log_warn "Bỏ qua kiểm tra"
    return
  fi
  if [[ "$DRY_RUN" == true ]]; then
    echo "[dry-run] kubectl get pods -n website"
    return
  fi

  echo ""
  kubectl get pods -n website
  kubectl get pvc -n website
  kubectl get ingress -n website website-ingress 2>/dev/null || true

  echo ""
  log_ok "Checklist:"
  echo "  [ ] https://${DOMAIN} — certificate hợp lệ"
  echo "  [ ] https://${DOMAIN}/admin — đăng nhập được"
  echo "  [ ] Upload media hiển thị đúng"
  echo "  [ ] Pod Running, PVC Bound"
  echo ""
  echo "Debug:"
  echo "  kubectl logs -n website -l app=website-deploy --tail=100"
  echo "  kubectl describe ingress -n website website-ingress"
  echo "  curl -I https://${DOMAIN}"
}

main() {
  trap mongo_port_forward_stop EXIT

  echo -e "${GREEN}website-deploy → OKE + Cloudflare${NC}"
  echo "Repo: $REPO_ROOT"
  echo ""

  require_cmd kubectl envsubst
  load_env

  step_connect_oke
  step_deploy_mongo
  step_build_push_image
  step_apply_k8s_app
  step_install_ingress
  step_create_tls_secret
  step_apply_ingress
  step_print_cloudflare_instructions
  step_apply_cronjob
  step_verify

  echo ""
  log_ok "Deploy script hoàn tất!"
  echo "Cập nhật version mới:"
  echo "  IMAGE_TAG=v1.0.1 ./scripts/deploy-oke.sh --skip-connect --skip-mongo --skip-ingress --skip-tls --skip-cron"
}

main "$@"
