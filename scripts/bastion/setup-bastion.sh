#!/bin/bash
# setup-bastion.sh - Script tự động tạo Bastion và kết nối tới OKE

set -euo pipefail

# === CẤU HÌNH ===
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

start_ssh_tunnel() {
  local log_file="${HOME}/.bastion-tunnel.log"
  local sni="${VCN_HOSTNAME%%:*}"
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

    for _ in $(seq 1 15); do
      if perl -e 'alarm 3; exec @ARGV' openssl s_client -connect "127.0.0.1:${LOCAL_PORT}" -servername "$sni" </dev/null 2>/dev/null \
        | grep -q "CONNECTED"; then
        return 0
      fi
      sleep 2
    done

    pkill -f "ssh.*bastionsession" 2>/dev/null || true
    sleep 3
  done

  echo "❌ SSH tunnel không kết nối được tới Kubernetes API (TLS timeout)."
  echo "   Log: $log_file"
  tail -5 "$log_file" 2>/dev/null || true
  exit 1
}

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
echo "🔍 Đang lấy OCID của Compartment..."
export COMP_ID=$(oci iam compartment list --include-root --query "data[?name=='$COMPARTMENT_NAME'].id | [0]" --raw-output)

echo "🔍 Đang lấy VCN và Node subnet của cluster (bastion phải ở node subnet, không phải API /28)..."
export VCN_ID
VCN_ID=$(oci ce cluster get --cluster-id "$CLUSTER_ID" --query 'data."vcn-id"' --raw-output)
export CLUSTER_NAME
CLUSTER_NAME=$(oci ce cluster get --cluster-id "$CLUSTER_ID" --query 'data.name' --raw-output)
export SUBNET_ID
SUBNET_ID=$(oci network subnet list --compartment-id "$COMP_ID" --vcn-id "$VCN_ID" --all \
  --query "data[?contains(\"display-name\", 'oke-nodesubnet') && contains(\"display-name\", '${CLUSTER_NAME}')].id | [0]" --raw-output)

if [[ -z "$SUBNET_ID" || "$SUBNET_ID" == "null" ]]; then
  echo "❌ Không tìm thấy node subnet cho cluster '$CLUSTER_NAME'."
  echo "   Bastion cần đặt trong oke-nodesubnet (có egress TCP/6443 tới API endpoint)."
  exit 1
fi
SUBNET_NAME=$(oci network subnet get --subnet-id "$SUBNET_ID" --query 'data."display-name"' --raw-output)
echo "   Node subnet: $SUBNET_NAME"

echo "🔍 Đang tạo Bastion Service..."
export BASTION_ID=$(oci bastion bastion create \
  --bastion-type standard \
  --compartment-id $COMP_ID \
  --target-subnet-id $SUBNET_ID \
  --client-cidr-list '["0.0.0.0/0"]' \
  --query 'data.id' \
  --raw-output)

echo "⏳ Đợi Bastion active..."
sleep 10

echo "🔍 Đang lấy IP Private của Kubernetes API endpoint..."
export API_IP VCN_HOSTNAME
API_IP=$(oci ce cluster get --cluster-id "$CLUSTER_ID" --query 'data.endpoints."private-endpoint"' --raw-output | cut -d: -f1)
VCN_HOSTNAME=$(oci ce cluster get --cluster-id "$CLUSTER_ID" --query 'data.endpoints."vcn-hostname-endpoint"' --raw-output)
echo "   API IP: $API_IP"

echo "🔍 Đang tạo Bastion Session (Port Forwarding)..."
export SESSION_ID
SESSION_ID=$(oci bastion session create-port-forwarding \
  --bastion-id $BASTION_ID \
  --display-name "session-oke-api" \
  --key-type PUB \
  --ssh-public-key-file $SSH_PUB_KEY_FILE \
  --target-private-ip $API_IP \
  --target-port 6443 \
  --query 'data.id' \
  --raw-output)

if [[ -z "$SESSION_ID" || "$SESSION_ID" == "null" ]]; then
  echo "❌ Không tạo được Bastion session."
  exit 1
fi

echo "⏳ Đợi session ACTIVE..."
wait_for_session_active
sleep 3

echo "🔑 Đang thiết lập SSH Tunnel..."
start_ssh_tunnel
TUNNEL_PID=$(pgrep -f "ssh.*bastionsession" | head -1 || true)
echo "✅ Tunnel đã chạy${TUNNEL_PID:+ với PID: $TUNNEL_PID}"

echo "📁 Đang tạo kubeconfig..."
oci ce cluster create-kubeconfig \
  --cluster-id $CLUSTER_ID \
  --file $HOME/.kube/config \
  --region $REGION \
  --token-version 2.0.0

# Backup file config và chỉ đổi server của cluster hiện tại (không ảnh hưởng cluster khác)
cp $HOME/.kube/config $HOME/.kube/config.backup
kubectl config use-context "context-${CLUSTER_ID: -11}" 2>/dev/null || true
CLUSTER_NAME=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')
kubectl config set-cluster "$CLUSTER_NAME" --server="https://127.0.0.1:$LOCAL_PORT"

echo "✅ Thiết lập hoàn tất! Đang kiểm tra kết nối..."
kubectl get nodes

echo ""
echo "📌 Tunnel đang chạy ngầm (PID: $TUNNEL_PID)"
echo "📌 Để dừng tunnel, chạy: kill $TUNNEL_PID"
echo "📌 Để deploy, chạy: kubectl apply -f <file-deployment>.yaml"