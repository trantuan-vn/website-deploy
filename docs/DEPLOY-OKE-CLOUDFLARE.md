# Hướng dẫn triển khai production trên OKE (OCI) và trỏ domain vccp.vn qua Cloudflare

Tài liệu này mô tả **từng bước** triển khai ứng dụng **website-deploy** (Payload CMS + Next.js) lên **Oracle Kubernetes Engine (OKE)** và cấu hình domain **vccp.vn** trên **Cloudflare**.

> **Khuyến nghị:** Dùng script tự động [`scripts/deploy-oke.sh`](../scripts/deploy-oke.sh) để chạy các bước 3–11 theo đúng thứ tự. Các mục dưới giải thích chi tiết từng bước khi cần làm thủ công hoặc debug.

---

## Mục lục

0. [Triển khai nhanh bằng script](#triển-khai-nhanh-bằng-script)
1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Yêu cầu trước khi bắt đầu](#2-yêu-cầu-trước-khi-bắt-đầu)
3. [Kết nối kubectl tới OKE qua Bastion](#3-kết-nối-kubectl-tới-oke-qua-bastion)
4. [Chuẩn bị MongoDB](#4-chuẩn-bị-mongodb)
5. [Build và push Docker image lên OCIR](#5-build-và-push-docker-image-lên-ocir)
   - [5.6 Workflow: Sửa code và deploy lại](#56-workflow-sửa-code-và-deploy-lại)
6. [Cài Ingress Controller trên OKE](#6-cài-ingress-controller-trên-oke)
7. [Triển khai ứng dụng lên Kubernetes](#7-triển-khai-ứng-dụng-lên-kubernetes)
8. [Cấu hình TLS cho origin (Full strict)](#8-cấu-hình-tls-cho-origin-full-strict)
9. [Lấy public IP của Load Balancer](#9-lấy-public-ip-của-load-balancer)
10. [Cấu hình Cloudflare DNS cho vccp.vn](#10-cấu-hình-cloudflare-dns-cho-vcppvn)
11. [Cấu hình Cloudflare SSL, Cache và WebSocket](#11-cấu-hình-cloudflare-ssl-cache-và-websocket)
12. [Cập nhật biến môi trường production](#12-cập-nhật-biến-môi-trường-production)
13. [Kiểm tra sau triển khai](#13-kiểm-tra-sau-triển-khai)
14. [Cron / Scheduled Publish](#14-cron--scheduled-publish)
15. [CI/CD (tùy chọn)](#15-cicd-tùy-chọn)
16. [Bảo mật bổ sung](#16-bảo-mật-bổ-sung)
17. [Xử lý sự cố thường gặp](#17-xử-lý-sự-cố-thường-gặp)
18. [Tham khảo nhanh lệnh](#18-tham-khảo-nhanh-lệnh)

---

## 1. Tổng quan kiến trúc

```
Người dùng
    │
    ▼
Cloudflare (DNS + CDN + TLS edge)
    │  https://vccp.vn
    ▼
OCI Load Balancer (public IP)
    │
    ▼
Ingress Controller (NGINX) trên OKE
    │
    ▼
Pod: website-deploy (Next.js + Payload, port 3000)
    │
    ├── PVC: /app/public/media  (upload ảnh/file)
    └── MongoDB (in-cluster hoặc managed bên ngoài)
```

**Thành phần chính:**

| Thành phần | Vai trò |
|------------|---------|
| **OKE** | Chạy container ứng dụng |
| **OCIR** | Lưu Docker image |
| **OCI Load Balancer** | Expose HTTP/HTTPS ra internet |
| **Cloudflare** | DNS, CDN, bảo vệ DDoS, TLS tới trình duyệt |
| **MongoDB** | Database cho Payload CMS |
| **PVC (Block Volume)** | Lưu media upload (`public/media`) |

---

## 2. Yêu cầu trước khi bắt đầu

### 2.1 Công cụ trên máy local

- [OCI CLI](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm) đã cấu hình (`oci setup config`)
- `kubectl`
- `docker` hoặc `docker buildx`
- `envsubst` (GNU gettext — có sẵn trên macOS/Linux)
- SSH key: `~/.ssh/id_ed25519` và `~/.ssh/id_ed25519.pub`
- `pnpm` (để build local nếu cần)

### 2.2 Tài nguyên OCI đã có

Theo cấu hình trong `scripts/bastion/`:

| Thông số | Giá trị |
|----------|---------|
| Region | `ap-singapore-1` |
| Compartment | `tuanta2021` |
| Cluster OKE | Private API endpoint |
| Domain production | `vccp.vn` |

### 2.3 Quyền IAM tối thiểu

- Quản lý OKE cluster
- Push/pull image trên OCIR
- Tạo Load Balancer
- Bastion session (nếu cluster private)

### 2.4 Cloudflare

- Domain `vccp.vn` đã add vào Cloudflare
- Nameserver của domain trỏ về Cloudflare

### 2.5 Biến môi trường cần chuẩn bị

Copy file mẫu và điền giá trị thật (không commit):

```bash
cp scripts/deploy-oke.env.example production.env
```

File `production.env` (repo root) gồm:

| Biến | Mô tả |
|------|--------|
| `OCIR_TENANCY_NAMESPACE` | Tenancy namespace trên OCIR |
| `OCIR_USERNAME` | Username OCI |
| `OCIR_AUTH_TOKEN` | Auth Token (OCI Console → User Settings → Auth Tokens) |
| `IMAGE_TAG` | Tag image, ví dụ `v1.0.0` |
| `DATABASE_URL` | Connection string MongoDB |
| `PAYLOAD_SECRET` | Random, ≥ 32 ký tự |
| `CRON_SECRET`, `PREVIEW_SECRET` | Random secrets |
| `NEXT_PUBLIC_SERVER_URL` | `https://vccp.vn` — không có dấu `/` ở cuối |
| `BUILD_DATABASE_URL` | Mongo reachable lúc `docker build` |
| `ORIGIN_CERT`, `ORIGIN_KEY` | Đường dẫn Cloudflare Origin Certificate |

Ví dụ tối thiểu:

```bash
# Database
DATABASE_URL=mongodb://mongo.website.svc.cluster.local:27017/website-deploy

# Payload / Next.js (random, ≥ 32 ký tự)
PAYLOAD_SECRET=<random-secret-32-chars-min>
CRON_SECRET=<random-secret>
PREVIEW_SECRET=<random-secret>

# Domain production — không có dấu / ở cuối
NEXT_PUBLIC_SERVER_URL=https://vccp.vn
```

Xem đầy đủ trong [`scripts/deploy-oke.env.example`](../scripts/deploy-oke.env.example).

---

## Triển khai nhanh bằng script

Repo có sẵn script [`scripts/deploy-oke.sh`](../scripts/deploy-oke.sh) và manifest Kubernetes trong thư mục [`k8s/`](../k8s/). Script thực hiện **11 bước** theo thứ tự triển khai ở cuối tài liệu.

### Chuẩn bị một lần

```bash
# 1. Cấu hình biến môi trường
cp scripts/deploy-oke.env.example production.env
# Sửa production.env với giá trị thật

# 2. Lần đầu: tạo Bastion (nếu chưa có)
cd scripts/bastion && ./setup-bastion.sh && cd ../..

# 3. Tạo repository trên OCIR (OCI Console → Container Registry → website-deploy)

# 4. Tạo Cloudflare Origin Certificate, lưu vào repo root:
#    origin.pem, origin.key  (xem mục 8.1)
```

### Deploy đầy đủ

```bash
chmod +x scripts/deploy-oke.sh
./scripts/deploy-oke.sh
```

Script sẽ tự động:

| Bước | Hành động |
|------|-----------|
| 1 | Gọi `scripts/bastion/connect-oke.sh` |
| 2 | Apply `k8s/mongo.yaml` (nếu `DEPLOY_MONGO=true`) |
| 3–4 | `docker build` + `docker push` lên OCIR |
| 5 | Tạo `ocir-secret`, `website-secrets`; apply namespace, configmap, pvc, deployment, service |
| 6 | Cài NGINX Ingress Controller (bỏ qua nếu đã có) |
| 7 | Tạo TLS secret từ `origin.pem` / `origin.key` |
| 8 | Apply `k8s/ingress.yaml` |
| 9 | In EXTERNAL-IP Load Balancer + hướng dẫn Cloudflare |
| 10 | Apply `k8s/cronjob.yaml` |
| 11 | Kiểm tra pods, PVC, ingress |

### Các tùy chọn thường dùng

```bash
./scripts/deploy-oke.sh --help              # xem tất cả flags
./scripts/deploy-oke.sh --dry-run           # in lệnh, không thực thi
./scripts/deploy-oke.sh --skip-connect      # kubectl đã kết nối sẵn
./scripts/deploy-oke.sh --skip-mongo        # dùng MongoDB Atlas / bên ngoài
./scripts/deploy-oke.sh --skip-build        # bỏ qua docker build
./scripts/deploy-oke.sh --skip-push         # bỏ qua docker push
./scripts/deploy-oke.sh --skip-ingress      # Ingress Controller đã cài
./scripts/deploy-oke.sh --skip-tls            # chưa có origin cert
./scripts/deploy-oke.sh --skip-cron         # bỏ qua CronJob
```

### Cập nhật version mới (sau khi sửa code)

Xem hướng dẫn đầy đủ tại [mục 5.6](#56-workflow-sửa-code-và-deploy-lại). Tóm tắt:

```bash
# Cách nhanh nhất (script chuyên redeploy):
./scripts/redeploy-oke.sh

# Hoặc chỉ định tag mới:
IMAGE_TAG=v1.0.2 ./scripts/redeploy-oke.sh
```

### Sau khi script chạy xong (thủ công trên Cloudflare)

Script **không** tự cấu hình Cloudflare. Làm tiếp trên dashboard:

1. **DNS:** A `@` → EXTERNAL-IP (Proxied); CNAME `www` → `vccp.vn`
2. **SSL/TLS:** Full (strict), Always Use HTTPS
3. **Cache Rules:** bypass `/admin`, `/api/`; cache `/_next/static/`
4. **Network:** WebSockets On
5. **Redirect:** `www.vccp.vn` → `https://vccp.vn${uri.path}` (301)

Chi tiết từng mục: [10](#10-cấu-hình-cloudflare-dns-cho-vcppvn), [11](#11-cấu-hình-cloudflare-ssl-cache-và-websocket).

### Cấu trúc file trong repo

```
scripts/
  deploy-oke.sh              # Script deploy chính (lần đầu + đầy đủ)
  redeploy-oke.sh            # Sau khi sửa code: build + push + rollout
  deploy-oke.env.example     # Mẫu production.env
  bastion/
    setup-bastion.sh         # Tạo Bastion lần đầu
    connect-oke.sh           # Kết nối kubectl qua tunnel
k8s/
  namespace.yaml
  mongo.yaml
  configmap.yaml
  pvc-media.yaml
  deployment.yaml            # image: ${OCIR_IMAGE} — render bởi script
  service.yaml
  ingress.yaml               # host: ${DOMAIN} — render bởi script
  cronjob.yaml
production.env               # Tạo local, không commit
origin.pem, origin.key       # Cloudflare Origin Certificate, không commit
```

> **Lưu ý:** Script tạo Kubernetes Secret qua `kubectl create secret` (từ `production.env`), **không** dùng file `k8s/secret.yaml` để tránh lộ secrets trong git.

---

## 3. Kết nối kubectl tới OKE qua Bastion

Cluster OKE dùng **private API endpoint**, cần Bastion + SSH tunnel.

### 3.1 Lần đầu tiên

```bash
cd scripts/bastion
chmod +x setup-bastion.sh connect-oke.sh
./setup-bastion.sh
```

Script sẽ:

1. Tạo Bastion trong `oke-nodesubnet` (không đặt trong API subnet `/28`)
2. Tạo port-forwarding session tới Kubernetes API
3. Thiết lập SSH tunnel `127.0.0.1:6443`
4. Tạo kubeconfig và chạy `kubectl get nodes`

### 3.2 Các lần sau

```bash
cd scripts/bastion
./connect-oke.sh
```

### 3.3 Xác nhận kết nối

```bash
kubectl get nodes
kubectl cluster-info
```

### 3.4 Lỗi thường gặp khi kết nối

| Lỗi | Cách xử lý |
|-----|------------|
| `connection refused 127.0.0.1:6443` | Chạy lại `./connect-oke.sh` |
| `TLS handshake timeout` | Bastion phải ở node subnet; hoặc thêm egress TCP/6443 từ bastion subnet → API subnet (xem `scripts/bastion/note.txt`) |
| Tunnel treo | `pkill -f "ssh.*bastion"` rồi `./connect-oke.sh` |

> **Lưu ý:** Mỗi phiên làm việc deploy, chạy `./connect-oke.sh` trước khi dùng `kubectl`.

---

## 4. Chuẩn bị MongoDB

Ứng dụng dùng `@payloadcms/db-mongodb`. Chọn **một** phương án:

### Phương án A — MongoDB trong cluster (MVP / thử nghiệm)

Phù hợp giai đoạn đầu, chưa cần HA. Manifest có sẵn tại [`k8s/mongo.yaml`](../k8s/mongo.yaml).

```bash
kubectl create namespace website   # hoặc: kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mongo.yaml
```

Hoặc để script tự deploy: `./scripts/deploy-oke.sh` (mặc định `DEPLOY_MONGO=true`).

<details>
<summary>Chi tiết manifest mongo.yaml</summary>

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mongo
  namespace: website
spec:
  ports:
    - port: 27017
  selector:
    app: mongo
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongo
  namespace: website
spec:
  serviceName: mongo
  replicas: 1
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
        - name: mongo
          image: mongo:7
          ports:
            - containerPort: 27017
          volumeMounts:
            - name: data
              mountPath: /data/db
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 20Gi
```

</details>

```bash
# Chỉ cần nếu deploy thủ công (script đã apply sẵn):
kubectl apply -f k8s/mongo.yaml
```

Connection string:

```
mongodb://mongo.website.svc.cluster.local:27017/website-deploy
```

### Phương án B — MongoDB Atlas (khuyến nghị production)

1. Tạo cluster MongoDB Atlas region **Singapore**
2. Whitelist IP: node subnet CIDR của OKE (hoặc `0.0.0.0/0` tạm thời khi test)
3. Lấy connection string và điền vào `DATABASE_URL`

### Phương án C — MongoDB trên VM OCI trong cùng VCN

Phù hợp khi muốn self-host nhưng không chạy DB trong K8s.

---

## 5. Build và push Docker image lên OCIR

> Script [`deploy-oke.sh`](../scripts/deploy-oke.sh) tự động build, login OCIR và push (bước 3–4). Các mục dưới dùng khi chạy thủ công.

### 5.1 Tạo repository trên OCIR

1. OCI Console → **Developer Services** → **Container Registry**
2. Tạo repository: `website-deploy`
3. Ghi lại:
   - **Tenancy namespace** (ví dụ: `axxxxx`)
   - **Region key**: `ap-singapore-1`

Image URL đầy đủ:

```
ap-singapore-1.ocir.io/<tenancy-namespace>/website-deploy:<tag>
```

### 5.2 Đăng nhập Docker vào OCIR

```bash
docker login ap-singapore-1.ocir.io
# Username: <tenancy-namespace>/<oci-username>
# Password: Auth Token (OCI Console → User Settings → Auth Tokens)
```

### 5.3 Build image

Dockerfile yêu cầu **database reachable lúc build** (Next.js pre-render). Có hai cách:

#### Cách 1 — Build khi Mongo đã chạy (khuyến nghị)

Nếu Mongo local hoặc qua tunnel:

```bash
cd /path/to/website-deploy

docker build \
  --build-arg DATABASE_URL="mongodb://host.docker.internal:27017/website-deploy" \
  --build-arg PAYLOAD_SECRET="build-time-secret-min-32-chars" \
  --build-arg NEXT_PUBLIC_SERVER_URL="https://vccp.vn" \
  -t ap-singapore-1.ocir.io/<tenancy-namespace>/website-deploy:v1.0.0 \
  .
```

> Trên Linux có thể cần `--network host` hoặc IP thật của Mongo thay vì `host.docker.internal`.

#### Cách 2 — Build trên CI với DB staging

Pipeline CI kết nối MongoDB staging trong VCN, truyền build-args từ secrets.

### 5.4 Push image

```bash
docker push ap-singapore-1.ocir.io/<tenancy-namespace>/website-deploy:v1.0.0
```

### 5.5 Tạo imagePullSecret trên K8s

Script deploy tạo/cập nhật secret tự động. Thủ công:

```bash
kubectl create secret docker-registry ocir-secret \
  --namespace website \
  --docker-server=ap-singapore-1.ocir.io \
  --docker-username='<tenancy-namespace>/<oci-username>' \
  --docker-password='<auth-token>' \
  --docker-email='<email>'
```

### 5.6 Workflow: Sửa code và deploy lại

Phần này mô tả **quy trình đầy đủ** mỗi khi bạn sửa code trong repo và muốn production (`https://vccp.vn`) chạy bản mới.

#### Tại sao cần build lại image?

Ứng dụng Next.js + Payload **không mount source code** vào pod. Pod chỉ chạy Docker image đã build sẵn (`node server.js`). Khi sửa file trong `src/`, cluster **không tự cập nhật** — bạn phải:

1. **Build** image mới (compile Next.js, pre-render trang tĩnh)
2. **Push** image lên OCIR
3. **Rollout** deployment để K8s kéo image mới và khởi động pod

> **Lưu ý:** Bước `docker build` **bắt buộc kết nối được MongoDB** vì template pre-render trang lúc build (truy vấn Pages/Posts từ DB). Nếu Mongo không reach được → build fail.

#### Checklist trước mỗi lần deploy

| # | Việc cần làm | Ghi chú |
|---|--------------|---------|
| 1 | `production.env` đã điền đủ OCIR + secrets | `cp scripts/deploy-oke.env.example production.env` |
| 2 | Mongo **reachable lúc build** | Xem [5.6.2](#562-chuẩn-bị-mongodb-cho-bước-build) |
| 3 | Tăng `IMAGE_TAG` | Khuyến nghị `v1.0.1`, `v1.0.2`, … (tránh dùng mãi `latest`) |
| 4 | `docker` đang chạy | Docker Desktop hoặc docker engine |
| 5 | Tunnel OKE (nếu dùng script) | `connect-oke.sh` hoặc để script tự gọi |

#### 5.6.1 Quy trình khuyến nghị (một lệnh)

```bash
# 1. Test local (tùy chọn nhưng nên làm)
pnpm install
pnpm build    # cần Mongo local hoặc .env trỏ DB có dữ liệu
pnpm start    # kiểm tra http://localhost:3000

# 2. Tăng tag trong production.env
#    IMAGE_TAG=v1.0.2

# 3. Deploy lại (build + push + rollout, bỏ qua hạ tầng đã có)
chmod +x scripts/redeploy-oke.sh
./scripts/redeploy-oke.sh

# Hoặc truyền tag trực tiếp:
IMAGE_TAG=v1.0.2 ./scripts/redeploy-oke.sh
```

`redeploy-oke.sh` gọi `deploy-oke.sh` với các flag:

- `--skip-mongo` — không tạo lại MongoDB
- `--skip-ingress` — không cài lại NGINX Ingress
- `--skip-tls` — không tạo lại TLS secret
- `--skip-cron` — không apply lại CronJob

Vẫn thực hiện: **connect OKE → docker build → docker push → cập nhật deployment → đợi rollout**.

Nếu `kubectl` đã kết nối sẵn trong terminal hiện tại:

```bash
./scripts/redeploy-oke.sh --skip-connect
```

#### 5.6.2 Chuẩn bị MongoDB cho bước build

`production.env` có hai biến DB:

| Biến | Dùng khi nào |
|------|--------------|
| `DATABASE_URL` | Runtime trên K8s — trỏ Mongo **trong cluster** (`mongo.website.svc.cluster.local`) |
| `BUILD_DATABASE_URL` | Lúc `docker build` trên máy local — trỏ Mongo **reachable từ Docker** |

**Phương án A — Mongo local (docker-compose)** *(phổ biến trên macOS)*

```bash
# Terminal 1: chạy Mongo local
docker compose up mongo -d

# production.env
BUILD_DATABASE_URL=mongodb://host.docker.internal:27017/website-deploy
```

**Phương án B — Port-forward Mongo trên cluster** *(dùng dữ liệu production/staging thật lúc build)*

```bash
# Terminal 1: kết nối OKE trước
cd scripts/bastion && ./connect-oke.sh

# Terminal 2: forward Mongo ra localhost
kubectl port-forward -n website svc/mongo 27017:27017

# production.env
BUILD_DATABASE_URL=mongodb://127.0.0.1:27017/website-deploy
```

Trên **Linux**, nếu `127.0.0.1` không vào được container build, thêm `--network host` khi build thủ công (xem 5.6.4).

**Phương án C — Mongo Atlas / VM ngoài cluster**

```bash
BUILD_DATABASE_URL=mongodb://<user>:<pass>@<host>:27017/website-deploy?authSource=admin
```

> Không dùng `DATABASE_URL` cluster (`mongo.website.svc.cluster.local`) cho `BUILD_DATABASE_URL` — hostname đó chỉ resolve **bên trong** K8s, máy local build không truy cập được.

#### 5.6.3 Các bước script thực hiện (chi tiết)

Khi chạy `./scripts/redeploy-oke.sh`, thứ tự thực tế:

```
[1] connect-oke.sh          → kubectl trỏ tới cluster private
[3] docker build            → build-args từ production.env:
                              BUILD_DATABASE_URL, BUILD_PAYLOAD_SECRET, NEXT_PUBLIC_SERVER_URL
[4] docker login + push     → đẩy lên ap-singapore-1.ocir.io/<ns>/website-deploy:<IMAGE_TAG>
[5] kubectl apply           → deployment mới với image tag mới, rollout pod
[11] verify                 → kiểm tra pod Running
```

Image URL đầy đủ (ví dụ):

```
ap-singapore-1.ocir.io/<tenancy-namespace>/website-deploy:v1.0.2
```

#### 5.6.4 Build và push thủ công (không dùng script)

Dùng khi debug build hoặc CI/CD tự viết pipeline.

```bash
# Load biến từ production.env
set -a && source production.env && set +a

OCIR_REGISTRY="${OCIR_REGION}.ocir.io"
OCIR_IMAGE="${OCIR_REGISTRY}/${OCIR_TENANCY_NAMESPACE}/website-deploy:${IMAGE_TAG}"
OCIR_DOCKER_USER="${OCIR_TENANCY_NAMESPACE}/${OCIR_USERNAME}"

# 1. Build
docker build \
  --build-arg DATABASE_URL="${BUILD_DATABASE_URL}" \
  --build-arg PAYLOAD_SECRET="${BUILD_PAYLOAD_SECRET}" \
  --build-arg NEXT_PUBLIC_SERVER_URL="${NEXT_PUBLIC_SERVER_URL}" \
  -t "${OCIR_IMAGE}" \
  .

# Linux: nếu build fail kết nối DB, thử:
# docker build --network host --build-arg DATABASE_URL="mongodb://127.0.0.1:27017/website-deploy" ...

# 2. Login OCIR
echo "${OCIR_AUTH_TOKEN}" | docker login "${OCIR_REGISTRY}" \
  -u "${OCIR_DOCKER_USER}" --password-stdin

# 3. Push
docker push "${OCIR_IMAGE}"

# 4. Kết nối OKE + cập nhật deployment
cd scripts/bastion && ./connect-oke.sh && cd ../..

# Cách 1: apply deployment qua script (chỉ bước k8s, không build)
./scripts/deploy-oke.sh --skip-connect --skip-build --skip-push \
  --skip-mongo --skip-ingress --skip-tls --skip-cron

# Cách 2: set image trực tiếp
kubectl set image deployment/website-deploy \
  app="${OCIR_IMAGE}" -n website

kubectl rollout status deployment/website-deploy -n website --timeout=600s
```

#### 5.6.5 Khi nào cần rebuild vs chỉ restart pod?

| Thay đổi | Cần build image mới? | Lệnh |
|----------|----------------------|------|
| Sửa code `src/`, `next.config.ts`, dependencies | **Có** | `./scripts/redeploy-oke.sh` |
| Đổi `NEXT_PUBLIC_SERVER_URL` / domain | **Có** (URL bake lúc build) | Tăng `IMAGE_TAG`, redeploy |
| Đổi `PAYLOAD_SECRET`, `CRON_SECRET`, … | Không (chỉ secret runtime) | `kubectl` update secret + `rollout restart` |
| Đổi `DATABASE_URL` | Không | Update `website-secrets` + restart |
| Purge cache Cloudflare | Không | Cloudflare dashboard → Purge |

Cập nhật secret runtime (không build lại):

```bash
kubectl create secret generic website-secrets \
  --namespace website \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=PAYLOAD_SECRET="$PAYLOAD_SECRET" \
  --from-literal=CRON_SECRET="$CRON_SECRET" \
  --from-literal=PREVIEW_SECRET="$PREVIEW_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment/website-deploy -n website
```

#### 5.6.6 Kiểm tra sau khi deploy lại

```bash
# Rollout thành công
kubectl rollout status deployment/website-deploy -n website

# Pod đang chạy image đúng tag
kubectl get deployment website-deploy -n website -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'

# Log ứng dụng
kubectl logs -n website -l app=website-deploy --tail=50 -f

# HTTP từ bên ngoài
curl -I https://vccp.vn
curl -I https://vccp.vn/admin
```

Checklist nhanh:

- [ ] `kubectl rollout status` → `successfully rolled out`
- [ ] Image trên deployment khớp `IMAGE_TAG` mới
- [ ] `https://vccp.vn` load được, thay đổi code đã hiện
- [ ] `/admin` đăng nhập OK
- [ ] Upload media vẫn hoạt động (PVC không bị xóa khi redeploy)

#### 5.6.7 Rollback nếu bản mới lỗi

```bash
# Quay về revision trước
kubectl rollout undo deployment/website-deploy -n website

# Hoặc deploy lại tag cũ đã biết ổn định
IMAGE_TAG=v1.0.1 ./scripts/redeploy-oke.sh --skip-connect
```

#### 5.6.8 Lỗi thường gặp khi build / redeploy

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| `docker build` fail: Mongo connection | `BUILD_DATABASE_URL` sai hoặc Mongo chưa chạy | Chạy `docker compose up mongo` hoặc `kubectl port-forward` |
| `ECONNREFUSED` lúc `pnpm build` / `next build` trong Docker | DB không reach từ container build | Dùng `host.docker.internal` (Mac/Win) hoặc `--network host` (Linux) |
| `ImagePullBackOff` | OCIR auth hết hạn / sai secret | Chạy lại deploy script (tạo lại `ocir-secret`) hoặc kiểm tra Auth Token |
| Pod `CrashLoopBackOff` sau deploy | Secret sai, DB không kết nối được runtime | `kubectl logs` + kiểm tra `DATABASE_URL` trong cluster |
| Site cũ sau deploy | Cloudflare cache | Purge cache hoặc hard refresh; bypass rule cho `/admin` |
| CORS / link sai domain | `NEXT_PUBLIC_SERVER_URL` sai lúc build | Sửa URL, **build lại** image với tag mới |
| Rollout timeout | Pod chưa pass readiness probe | `kubectl describe pod -n website`; đợi thêm hoặc xem log |
| Dùng lại cùng `IMAGE_TAG` | Một số node cache image cũ | Luôn tăng tag (`v1.0.3` → `v1.0.4`) |

#### 5.6.9 Ví dụ `production.env` cho redeploy hàng ngày

```bash
# OCIR
OCIR_REGION=ap-singapore-1
OCIR_TENANCY_NAMESPACE=axxxxx
OCIR_USERNAME=your@email.com
OCIR_AUTH_TOKEN=<auth-token-from-oci-console>
OCIR_EMAIL=your@email.com
IMAGE_TAG=v1.0.2                    # ← tăng mỗi lần deploy

# Domain
DOMAIN=vccp.vn
NEXT_PUBLIC_SERVER_URL=https://vccp.vn

# Runtime (trên K8s)
DATABASE_URL=mongodb://mongo.website.svc.cluster.local:27017/website-deploy
PAYLOAD_SECRET=<secret-32-chars-min>
CRON_SECRET=<cron-secret>
PREVIEW_SECRET=<preview-secret>

# Build-time (máy local)
BUILD_DATABASE_URL=mongodb://host.docker.internal:27017/website-deploy
BUILD_PAYLOAD_SECRET=build-time-secret-min-32-chars

DEPLOY_MONGO=false                  # redeploy: không tạo lại Mongo
```

---

## 6. Cài Ingress Controller trên OKE

> Script deploy cài NGINX Ingress nếu chưa có (bước 6, flag `--skip-ingress` để bỏ qua).

### 6.1 Cài NGINX Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/cloud/deploy.yaml
```

Đợi pod ready:

```bash
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

Service `ingress-nginx-controller` type `LoadBalancer` sẽ được OCI cấp **public IP** (dùng ở bước DNS).

### 6.2 Kiểm tra Security List

Đảm bảo subnet của Load Balancer cho phép:

- Ingress TCP **80**, **443** từ `0.0.0.0/0` (hoặc chỉ Cloudflare IP ranges)
- Egress tới node subnet / pod network

---

## 7. Triển khai ứng dụng lên Kubernetes

Manifest Kubernetes có sẵn trong thư mục [`k8s/`](../k8s/). Script [`scripts/deploy-oke.sh`](../scripts/deploy-oke.sh) apply toàn bộ và tạo secrets từ `production.env`.

Các mục dưới mô tả chi tiết từng resource khi deploy **thủ công**.

### 7.1 Namespace

`k8s/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: website
```

```bash
kubectl apply -f k8s/namespace.yaml
```

### 7.2 Secret

Script deploy tạo secret qua lệnh (khuyến nghị — không lưu secrets trong git):

```bash
kubectl create secret generic website-secrets \
  --namespace website \
  --from-literal=DATABASE_URL="mongodb://mongo.website.svc.cluster.local:27017/website-deploy" \
  --from-literal=PAYLOAD_SECRET="REPLACE_WITH_RANDOM_SECRET" \
  --from-literal=CRON_SECRET="REPLACE_WITH_RANDOM_SECRET" \
  --from-literal=PREVIEW_SECRET="REPLACE_WITH_RANDOM_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -
```

Hoặc tạo file `k8s/secret.yaml` local (không commit) nếu deploy thủ công:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: website-secrets
  namespace: website
type: Opaque
stringData:
  DATABASE_URL: "mongodb://mongo.website.svc.cluster.local:27017/website-deploy"
  PAYLOAD_SECRET: "REPLACE_WITH_RANDOM_SECRET"
  CRON_SECRET: "REPLACE_WITH_RANDOM_SECRET"
  PREVIEW_SECRET: "REPLACE_WITH_RANDOM_SECRET"
```

```bash
kubectl apply -f k8s/secret.yaml
```

### 7.3 ConfigMap

`k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: website-config
  namespace: website
data:
  NEXT_PUBLIC_SERVER_URL: "https://vccp.vn"
```

```bash
kubectl apply -f k8s/configmap.yaml
```

### 7.4 PersistentVolumeClaim (media uploads)

Payload ghi file vào `/app/public/media`. **Bắt buộc** dùng PVC.

`k8s/pvc-media.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: website-media-pvc
  namespace: website
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

```bash
kubectl apply -f k8s/pvc-media.yaml
```

> **Scale nhiều replica:** cần storage `ReadWriteMany` (OCI File Storage) hoặc chuyển media sang Object Storage.

### 7.5 Deployment

[`k8s/deployment.yaml`](../k8s/deployment.yaml) — script thay `${OCIR_IMAGE}` bằng image OCIR thật khi apply:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: website-deploy
  namespace: website
spec:
  replicas: 1
  selector:
    matchLabels:
      app: website-deploy
  template:
    metadata:
      labels:
        app: website-deploy
    spec:
      imagePullSecrets:
        - name: ocir-secret
      containers:
        - name: app
          image: ${OCIR_IMAGE}
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: website-secrets
                  key: DATABASE_URL
            - name: PAYLOAD_SECRET
              valueFrom:
                secretKeyRef:
                  name: website-secrets
                  key: PAYLOAD_SECRET
            - name: CRON_SECRET
              valueFrom:
                secretKeyRef:
                  name: website-secrets
                  key: CRON_SECRET
            - name: PREVIEW_SECRET
              valueFrom:
                secretKeyRef:
                  name: website-secrets
                  key: PREVIEW_SECRET
            - name: NEXT_PUBLIC_SERVER_URL
              valueFrom:
                configMapKeyRef:
                  name: website-config
                  key: NEXT_PUBLIC_SERVER_URL
          volumeMounts:
            - name: media
              mountPath: /app/public/media
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: "1"
              memory: 1Gi
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 20
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 40
            periodSeconds: 20
      volumes:
        - name: media
          persistentVolumeClaim:
            claimName: website-media-pvc
```

```bash
kubectl apply -f k8s/deployment.yaml
```

### 7.6 Service

`k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: website-deploy
  namespace: website
spec:
  type: ClusterIP
  selector:
    app: website-deploy
  ports:
    - name: http
      port: 80
      targetPort: 3000
```

```bash
kubectl apply -f k8s/service.yaml
```

### 7.7 Kiểm tra pod (trước khi mở domain)

```bash
kubectl get pods -n website
kubectl logs -n website -l app=website-deploy -f
```

Port-forward test local:

```bash
kubectl port-forward -n website svc/website-deploy 3000:80
# Mở http://localhost:3000/admin
```

---

## 8. Cấu hình TLS cho origin (Full strict)

Cloudflare ở chế độ **Full (strict)** yêu cầu origin (OCI LB) có certificate hợp lệ.

### 8.1 Tạo Cloudflare Origin Certificate

1. Cloudflare Dashboard → chọn zone **vccp.vn**
2. **SSL/TLS** → **Origin Server** → **Create Certificate**
3. Hostnames:
   - `vccp.vn`
   - `*.vccp.vn`
4. Validity: 15 years (mặc định)
5. Download:
   - `origin.pem` (certificate)
   - `origin.key` (private key)

### 8.2 Tạo Kubernetes TLS Secret

Đặt `origin.pem` và `origin.key` ở repo root (hoặc đường dẫn trong `ORIGIN_CERT`/`ORIGIN_KEY` của `production.env`). Script deploy tạo secret tự động ở bước 7.

Thủ công:

```bash
kubectl create secret tls website-tls \
  --namespace website \
  --cert=origin.pem \
  --key=origin.key
```

### 8.3 Ingress

[`k8s/ingress.yaml`](../k8s/ingress.yaml) — script thay `${DOMAIN}` khi apply:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: website-ingress
  namespace: website
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/use-forwarded-headers: "true"
    nginx.ingress.kubernetes.io/compute-full-forwarded-for: "true"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - ${DOMAIN}          # script thay bằng vccp.vn
        - www.${DOMAIN}
      secretName: website-tls
  rules:
    - host: ${DOMAIN}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: website-deploy
                port:
                  number: 80
    - host: www.${DOMAIN}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: website-deploy
                port:
                  number: 80
```

```bash
kubectl apply -f k8s/ingress.yaml
```

---

## 9. Lấy public IP của Load Balancer

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

Cột `EXTERNAL-IP` là IP public — ghi lại, ví dụ `130.61.xxx.xxx`.

Hoặc:

```bash
kubectl get ingress -n website website-ingress
```

Đợi 2–5 phút nếu IP đang `<pending>`.

---

## 10. Cấu hình Cloudflare DNS cho vccp.vn

Cloudflare Dashboard → **vccp.vn** → **DNS** → **Records**.

### 10.1 Bản ghi apex (bắt buộc)

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| **A** | `@` | `<EXTERNAL-IP của LB>` | **Proxied** (đám mây cam) | Auto |

### 10.2 Bản ghi www (khuyến nghị)

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| **CNAME** | `www` | `vccp.vn` | **Proxied** |

### 10.3 Redirect www → apex

Cloudflare → **Rules** → **Redirect Rules** → Create rule:

- **If:** Hostname equals `www.vccp.vn`
- **Then:** Dynamic redirect → `https://vccp.vn${uri.path}` — Status **301**

### 10.4 Lưu ý khi Proxied

- `dig vccp.vn` sẽ trả về **IP Cloudflare**, không phải IP OCI — điều này **bình thường**
- Traffic: User → Cloudflare → OCI Load Balancer → Pod

---

## 11. Cấu hình Cloudflare SSL, Cache và WebSocket

### 11.1 SSL/TLS

| Setting | Giá trị |
|---------|---------|
| **SSL/TLS encryption mode** | **Full (strict)** |
| **Always Use HTTPS** | On |
| **Minimum TLS Version** | 1.2 |
| **Automatic HTTPS Rewrites** | On |

> **Không dùng Flexible** — sẽ gây redirect loop hoặc traffic HTTP tới origin.

### 11.2 Cache Rules (quan trọng cho Payload CMS)

Tạo rules theo thứ tự ưu tiên:

**Rule 1 — Bypass admin**

- If: URI Path contains `/admin`
- Then: Cache eligibility → **Bypass cache**

**Rule 2 — Bypass API**

- If: URI Path contains `/api/`
- Then: Cache eligibility → **Bypass cache**

**Rule 3 — Cache static Next.js**

- If: URI Path starts with `/_next/static/`
- Then: Cache eligibility → Eligible, Edge TTL → 1 month

**Rule 4 — Media API (tùy chọn)**

- If: URI Path starts with `/api/media/file/`
- Then: Bypass hoặc cache ngắn tùy nhu cầu cập nhật ảnh

### 11.3 WebSocket (Live Preview)

Cloudflare → **Network** → **WebSockets**: **On**

### 11.4 Upload file lớn

- Ingress đã set `proxy-body-size: 50m`
- Gói Cloudflare Free giới hạn upload ~100MB — đủ cho hầu hết media CMS

---

## 12. Cập nhật biến môi trường production

Sau khi domain hoạt động, đảm bảo:

```bash
NEXT_PUBLIC_SERVER_URL=https://vccp.vn
```

### 12.1 Cập nhật ConfigMap và rollout

```bash
kubectl apply -f k8s/configmap.yaml
kubectl rollout restart deployment/website-deploy -n website
```

### 12.2 Rebuild image nếu URL bake lúc build

Dockerfile truyền `NEXT_PUBLIC_SERVER_URL` lúc build. Nếu đổi domain, **build lại image** với tag mới:

```bash
IMAGE_TAG=v1.0.1 ./scripts/deploy-oke.sh \
  --skip-connect --skip-mongo --skip-ingress --skip-tls --skip-cron
```

Hoặc build thủ công:

```bash
--build-arg NEXT_PUBLIC_SERVER_URL="https://vccp.vn"
```

Rồi push tag mới và cập nhật deployment (script làm tự động khi `IMAGE_TAG` thay đổi).

---

## 13. Kiểm tra sau triển khai

### 13.1 Checklist

- [ ] `https://vccp.vn` mở được, certificate hợp lệ
- [ ] `https://vccp.vn/admin` — đăng nhập được
- [ ] Tạo/sửa bài viết, publish OK
- [ ] Upload ảnh media hiển thị đúng
- [ ] `www.vccp.vn` redirect về `vccp.vn`
- [ ] Không có mixed content (http asset trên trang https)
- [ ] Pod `Running`, PVC `Bound`

### 13.2 Lệnh kiểm tra

```bash
# HTTPS header
curl -I https://vccp.vn

# Pod logs
kubectl logs -n website -l app=website-deploy --tail=100

# Ingress events
kubectl describe ingress -n website website-ingress
```

### 13.3 Tạo admin user lần đầu

Truy cập `https://vccp.vn/admin` — Payload sẽ hướng dẫn tạo user đầu tiên nếu database trống.

> **Không** chạy seed production trừ khi chấp nhận xóa toàn bộ dữ liệu (seed destructive).

---

## 14. Cron / Scheduled Publish

Payload hỗ trợ scheduled publish qua jobs queue. Manifest có sẵn tại [`k8s/cronjob.yaml`](../k8s/cronjob.yaml) — script apply tự động ở bước 10.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: payload-cron
  namespace: website
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: curl
              image: curlimages/curl:8.5.0
              env:
                - name: CRON_SECRET
                  valueFrom:
                    secretKeyRef:
                      name: website-secrets
                      key: CRON_SECRET
              command:
                - /bin/sh
                - -c
                - |
                  curl -fsS -X POST \
                    -H "Authorization: Bearer ${CRON_SECRET}" \
                    "https://vccp.vn/api/payload-jobs/run"
```

```bash
kubectl apply -f k8s/cronjob.yaml
```

---

## 15. CI/CD (tùy chọn)

Luồng đề xuất:

```
git push → GitHub Actions / OCI DevOps
    → docker build (với DATABASE_URL staging)
    → docker push OCIR
    → kubectl set image (qua bastion tunnel)
```

**GitHub Actions cần:**

- Secrets: `OCIR_USERNAME`, `OCIR_PASSWORD`, `DATABASE_URL_STAGING`, `PAYLOAD_SECRET`
- Bước SSH tunnel tới OKE API (hoặc runner trong VCN)
- `kubectl rollout status deployment/website-deploy -n website`

---

## 16. Bảo mật bổ sung

### 16.1 Không commit secrets

Thêm vào `.gitignore`:

```
k8s/secret.yaml
production.env
origin.pem
origin.key
```

### 16.2 Giới hạn ingress chỉ từ Cloudflare (tùy chọn)

Cập nhật Security List của LB subnet chỉ cho phép [Cloudflare IP ranges](https://www.cloudflare.com/ips/).

### 16.3 MongoDB không public

- In-cluster: không expose Service type LoadBalancer
- Atlas: whitelist chỉ IP egress của OKE nodes

### 16.4 Network Policy (nâng cao)

Chỉ cho phép pod app kết nối Mongo port 27017.

---

## 17. Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân có thể | Cách xử lý |
|-------------|-------------------|------------|
| Redirect loop | SSL mode **Flexible** | Đổi **Full (strict)** + origin cert |
| Cloudflare **522** | LB/pod không phản hồi | `kubectl get pods`, kiểm tra health check LB |
| Cloudflare **525** SSL handshake | Origin cert sai hostname | Tạo lại origin cert cho `vccp.vn` |
| Admin load, API lỗi | Cache Cloudflare | Bypass cache `/admin`, `/api/` |
| Ảnh upload mất sau restart | Không có PVC | Kiểm tra `website-media-pvc` mounted |
| CORS / link sai | `NEXT_PUBLIC_SERVER_URL` sai | Set `https://vccp.vn`, rebuild nếu cần |
| `ImagePullBackOff` | OCIR auth sai | Kiểm tra `ocir-secret` |
| `kubectl` timeout | SSH tunnel chết | `./connect-oke.sh` |
| Build Docker fail DB | Mongo không reach được lúc build | Chạy Mongo trước, dùng `--network host` |

### Debug nhanh

```bash
# Pod
kubectl describe pod -n website -l app=website-deploy
kubectl logs -n website -l app=website-deploy --previous

# Ingress
kubectl describe ingress -n website website-ingress

# Events namespace
kubectl get events -n website --sort-by='.lastTimestamp'
```

---

## 18. Tham khảo nhanh lệnh

```bash
# Deploy toàn bộ (khuyến nghị)
cp scripts/deploy-oke.env.example production.env   # lần đầu
./scripts/deploy-oke.sh

# Kết nối OKE (mỗi phiên làm việc)
cd scripts/bastion && ./connect-oke.sh

# Deploy thủ công từng bước
kubectl apply -f k8s/namespace.yaml
kubectl create secret generic website-secrets ...   # xem mục 7.2
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/pvc-media.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Cập nhật version mới (sau khi sửa code)
IMAGE_TAG=v1.0.2 ./scripts/redeploy-oke.sh
# hoặc:
IMAGE_TAG=v1.0.2 ./scripts/deploy-oke.sh \
  --skip-connect --skip-mongo --skip-ingress --skip-tls --skip-cron

# Hoặc thủ công:
kubectl set image deployment/website-deploy \
  app=ap-singapore-1.ocir.io/<ns>/website-deploy:v1.0.1 \
  -n website
kubectl rollout status deployment/website-deploy -n website

# Rollback
kubectl rollout undo deployment/website-deploy -n website
```

---

## Tài liệu liên quan

- [Oracle: Deploy OKE with Bastion](https://docs.oracle.com/en/solutions/deploy-oke-with-bastion-and-github/index.html)
- Script deploy: [`scripts/deploy-oke.sh`](../scripts/deploy-oke.sh), [`scripts/redeploy-oke.sh`](../scripts/redeploy-oke.sh), [`scripts/deploy-oke.env.example`](../scripts/deploy-oke.env.example)
- Script bastion: [`scripts/bastion/setup-bastion.sh`](../scripts/bastion/setup-bastion.sh), [`scripts/bastion/connect-oke.sh`](../scripts/bastion/connect-oke.sh)
- Manifest Kubernetes: [`k8s/`](../k8s/)
- Docker production: `Dockerfile`, `docker-compose.prod.yml`
- Biến môi trường mẫu: `.env.example`

---

## Thứ tự triển khai tóm tắt

**Cách nhanh:** `./scripts/deploy-oke.sh` (sau khi có `production.env` và `origin.pem`/`origin.key`).

**Chi tiết từng bước:**

```
1.  cp scripts/deploy-oke.env.example production.env  # điền giá trị thật
2.  ./scripts/deploy-oke.sh                           # hoặc từng bước bên dưới
    ├── ./connect-oke.sh
    ├── Deploy MongoDB (k8s/mongo.yaml)
    ├── docker build + push OCIR
    ├── kubectl create secret ocir-secret + website-secrets
    ├── kubectl apply k8s/* (namespace, configmap, pvc, deployment, service)
    ├── Cài NGINX Ingress (nếu chưa có)
    ├── Cloudflare Origin Certificate → kubectl create secret tls
    ├── kubectl apply ingress.yaml
    ├── Apply cronjob.yaml
    └── Kiểm tra pods / ingress
3.  Lấy EXTERNAL-IP của LB (script in ra ở bước 9)
4.  Cloudflare DNS: A @ → IP (Proxied)
5.  Cloudflare SSL: Full (strict) + Cache Rules
6.  Kiểm tra https://vccp.vn và /admin
```
