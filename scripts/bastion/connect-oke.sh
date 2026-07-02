#!/bin/bash
# connect-oke.sh - Tạo lại bastion session + SSH tunnel tới OKE (bastion đã tồn tại)

set -euo pipefail

COMPARTMENT_NAME="tuanta2021"
CLUSTER_ID="ocid1.cluster.oc1.ap-singapore-1.aaaaaaaadt4f5zumukh6cte7p2bjdnn5j4ks57mdfinjhqvqmcdsgkdhkqjq"
REGION="ap-singapore-1"
SSH_PUB_KEY_FILE="$HOME/.ssh/id_ed25519.pub"
SSH_PRIV_KEY_FILE="$HOME/.ssh/id_ed25519"
LOCAL_PORT=6443
BASTION_HOST="host.bastion.${REGION}.oci.oraclecloud.com"

if [[ ! -f "$SSH_PUB_KEY_FILE" || ! -f "$SSH_PRIV_KEY_FILE" ]]; then
  echo "❌ Không tìm thấy SSH key: $SSH_PUB_KEY_FILE / $SSH_PRIV_KEY_FILE"
  exit 1
fi

wait_for_session_active() {
  for _ in $(seq 1 30); do
    local state
    state=$(oci bastion session get --session-id "$SESSION_ID" --query 'data."lifecycle-state"' --raw-output 2>/dev/null || true)
    if [[ "$state" == "ACTIVE" ]]; then
      return 0
    fi
    sleep 2
  done
  echo "❌ Session chưa ACTIVE sau 60s: $SESSION_ID"
  exit 1
}

ensure_bastion_network_rules() {
  local api_subnet_cidr api_sl_id egress_rules
  api_subnet_cidr=$(oci network subnet get --subnet-id "$API_SUBNET_ID" --query 'data."cidr-block"' --raw-output)
  api_sl_id=$(oci network subnet get --subnet-id "$API_SUBNET_ID" --query 'data."security-list-ids"[0]' --raw-output)
  egress_rules=$(oci network security-list get --security-list-id "$api_sl_id" --query 'data."egress-security-rules"' --output json)

  if echo "$egress_rules" | jq -e --arg cidr "$api_subnet_cidr" \
    '.[] | select(.destination == $cidr and .protocol == "6" and ."tcp-options"."destination-port-range".min == 6443)' >/dev/null; then
    return 0
  fi

  echo "⚙️  Thiếu egress TCP/6443 từ bastion subnet → API subnet ($api_subnet_cidr), đang thêm rule..."
  local new_rule updated
  new_rule=$(jq -n --arg cidr "$api_subnet_cidr" \
    '{description:"Allow bastion to Kubernetes API endpoint communication",destination:$cidr,"destination-type":"CIDR_BLOCK","is-stateless":false,protocol:"6","tcp-options":{"destination-port-range":{"min":6443,"max":6443}}}')
  updated=$(echo "$egress_rules" | jq --argjson rule "$new_rule" '. + [$rule]')
  oci network security-list update --security-list-id "$api_sl_id" --egress-security-rules "$updated" --force >/dev/null
  echo "   Đã thêm egress rule vào security list API subnet."
}

verify_tunnel() {
  local sni="${VCN_HOSTNAME%%:*}"
  for _ in $(seq 1 15); do
    if perl -e 'alarm 3; exec @ARGV' openssl s_client -connect "127.0.0.1:${LOCAL_PORT}" -servername "$sni" </dev/null 2>/dev/null \
      | grep -q "CONNECTED"; then
      return 0
    fi
    sleep 2
  done
  return 1
}

delete_stale_sessions() {
  oci bastion session list --bastion-id "$BASTION_ID" --all --output json \
    | jq -r --arg ip "$API_IP" \
      '.data[]
        | select(."lifecycle-state"=="ACTIVE" and ."target-resource-details"."target-resource-private-ip-address"==$ip)
        | .id' \
    | while read -r sid; do
        [[ -n "$sid" ]] || continue
        echo "🗑️  Xóa session cũ: $sid"
        oci bastion session delete --session-id "$sid" --force >/dev/null
      done
}

start_ssh_tunnel() {
  local log_file="${HOME}/.bastion-tunnel.log"
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  ssh-keyscan -p 22 "$BASTION_HOST" >> "$HOME/.ssh/known_hosts" 2>/dev/null || true

  pkill -f "ssh.*bastionsession" 2>/dev/null || true
  sleep 1

  : > "$log_file"
  for attempt in $(seq 1 5); do
    ssh -f \
      -o ExitOnForwardFailure=yes \
      -o StrictHostKeyChecking=accept-new \
      -o ServerAliveInterval=30 \
      -o ServerAliveCountMax=3 \
      -i "$SSH_PRIV_KEY_FILE" \
      -N \
      -L "${LOCAL_PORT}:${API_IP}:6443" \
      -p 22 \
      "${SESSION_ID}@${BASTION_HOST}" </dev/null >>"$log_file" 2>&1 || true

    if verify_tunnel; then
      return 0
    fi

    pkill -f "ssh.*bastionsession" 2>/dev/null || true
    sleep 3
  done

  echo "❌ SSH tunnel không kết nối được tới Kubernetes API (TLS timeout)."
  echo "   Log: $log_file"
  tail -5 "$log_file" 2>/dev/null || true
  echo "   Kiểm tra: bastion subnet cần egress TCP/6443 tới API subnet, hoặc đặt bastion trong node subnet."
  exit 1
}

echo "🔍 Đang lấy Bastion hiện có..."
export COMP_ID
COMP_ID=$(oci iam compartment list --include-root --query "data[?name=='$COMPARTMENT_NAME'].id | [0]" --raw-output)
export BASTION_ID
BASTION_ID=$(oci bastion bastion list --compartment-id "$COMP_ID" --bastion-lifecycle-state ACTIVE --all --query 'data[0].id' --raw-output)

if [[ -z "$BASTION_ID" || "$BASTION_ID" == "null" ]]; then
  echo "❌ Không tìm thấy Bastion ACTIVE. Chạy ./setup-bastion.sh trước."
  exit 1
fi
echo "   Bastion: $BASTION_ID"

BASTION_SUBNET_ID=$(oci bastion bastion get --bastion-id "$BASTION_ID" --query 'data."target-subnet-id"' --raw-output)

echo "🔍 Đang lấy IP Private của Kubernetes API endpoint..."
export API_IP API_SUBNET_ID VCN_HOSTNAME
API_IP=$(oci ce cluster get --cluster-id "$CLUSTER_ID" --query 'data.endpoints."private-endpoint"' --raw-output | cut -d: -f1)
API_SUBNET_ID=$(oci ce cluster get --cluster-id "$CLUSTER_ID" --query 'data."endpoint-config"."subnet-id"' --raw-output)
VCN_HOSTNAME=$(oci ce cluster get --cluster-id "$CLUSTER_ID" --query 'data.endpoints."vcn-hostname-endpoint"' --raw-output)
echo "   API IP: $API_IP"

if [[ "$BASTION_SUBNET_ID" == "$API_SUBNET_ID" ]]; then
  ensure_bastion_network_rules
fi

delete_stale_sessions

echo "🔍 Đang tạo Bastion Session mới (public key: $SSH_PUB_KEY_FILE)..."
export SESSION_ID
SESSION_ID=$(oci bastion session create-port-forwarding \
  --bastion-id "$BASTION_ID" \
  --display-name "session-oke-api-$(date +%s)" \
  --key-type PUB \
  --ssh-public-key-file "$SSH_PUB_KEY_FILE" \
  --target-private-ip "$API_IP" \
  --target-port 6443 \
  --query 'data.id' \
  --raw-output)

if [[ -z "$SESSION_ID" || "$SESSION_ID" == "null" ]]; then
  echo "❌ Không tạo được Bastion session. Kiểm tra quyền IAM hoặc trạng thái Bastion."
  exit 1
fi
echo "   Session: $SESSION_ID"
echo "⏳ Đợi session ACTIVE..."
wait_for_session_active
sleep 3

echo "🔑 Đang thiết lập SSH Tunnel..."
start_ssh_tunnel
TUNNEL_PID=$(pgrep -f "ssh.*bastionsession" | head -1 || true)
echo "✅ Tunnel đã chạy${TUNNEL_PID:+ với PID: $TUNNEL_PID}"

CONTEXT_SUFFIX="${CLUSTER_ID: -11}"
kubectl config use-context "context-${CONTEXT_SUFFIX}"
CLUSTER_NAME=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')
kubectl config set-cluster "$CLUSTER_NAME" --server="https://127.0.0.1:$LOCAL_PORT"

echo "✅ Kết nối thành công!"
kubectl get nodes

echo ""
echo "📌 SESSION_ID=$SESSION_ID"
echo "📌 Tunnel PID: ${TUNNEL_PID:-unknown} (dừng: pkill -f 'ssh.*bastion')"
