# Hướng dẫn triển khai production trên OKE (OCI) và trỏ domain vcpp.vn qua Cloudflare

Tài liệu này mô tả **từng bước** triển khai ứng dụng **website-deploy** (Payload CMS + Next.js) lên **Oracle Kubernetes Engine (OKE)** và cấu hình domain **vcpp.vn** trên **Cloudflare**.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Yêu cầu trước khi bắt đầu](#2-yêu-cầu-trước-khi-bắt-đầu)
3. [Kết nối kubectl tới OKE qua Bastion](#3-kết-nối-kubectl-tới-oke-qua-bastion)
4. [Chuẩn bị MongoDB](#4-chuẩn-bị-mongodb)
5. [Build và push Docker image lên OCIR](#5-build-và-push-docker-image-lên-ocir)
6. [Cài Ingress Controller trên OKE](#6-cài-ingress-controller-trên-oke)
7. [Triển khai ứng dụng lên Kubernetes](#7-triển-khai-ứng-dụng-lên-kubernetes)
8. [Cấu hình TLS cho origin (Full strict)](#8-cấu-hình-tls-cho-origin-full-strict)
9. [Lấy public IP của Load Balancer](#9-lấy-public-ip-của-load-balancer)
10. [Cấu hình Cloudflare DNS cho vcpp.vn](#10-cấu-hình-cloudflare-dns-cho-vcppvn)
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
    │  https://vcpp.vn
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
- SSH key: `~/.ssh/id_ed25519` và `~/.ssh/id_ed25519.pub`
- `pnpm` (để build local nếu cần)

### 2.2 Tài nguyên OCI đã có

Theo cấu hình trong `scripts/bastion/`:

| Thông số | Giá trị |
|----------|---------|
| Region | `ap-singapore-1` |
| Compartment | `tuanta2021` |
| Cluster OKE | Private API endpoint |
| Domain production | `vcpp.vn` |

### 2.3 Quyền IAM tối thiểu

- Quản lý OKE cluster
- Push/pull image trên OCIR
- Tạo Load Balancer
- Bastion session (nếu cluster private)

### 2.4 Cloudflare

- Domain `vcpp.vn` đã add vào Cloudflare
- Nameserver của domain trỏ về Cloudflare

### 2.5 Biến môi trường cần chuẩn bị

Tạo file local (không commit) `production.env` với các giá trị thật:

```bash
# Database
DATABASE_URL=mongodb://<user>:<password>@<mongo-host>:27017/website-deploy?authSource=admin

# Payload / Next.js (random, ≥ 32 ký tự)
PAYLOAD_SECRET=<random-secret-32-chars-min>
CRON_SECRET=<random-secret>
PREVIEW_SECRET=<random-secret>

# Domain production — không có dấu / ở cuối
NEXT_PUBLIC_SERVER_URL=https://vcpp.vn
```

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

Phù hợp giai đoạn đầu, chưa cần HA.

```bash
kubectl create namespace website
```

Tạo file `k8s/mongo.yaml` (ví dụ tối giản):

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

```bash
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
  --build-arg NEXT_PUBLIC_SERVER_URL="https://vcpp.vn" \
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

```bash
kubectl create secret docker-registry ocir-secret \
  --namespace website \
  --docker-server=ap-singapore-1.ocir.io \
  --docker-username='<tenancy-namespace>/<oci-username>' \
  --docker-password='<auth-token>' \
  --docker-email='<email>'
```

---

## 6. Cài Ingress Controller trên OKE

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

Tạo thư mục `k8s/` trong repo (nếu chưa có) với các manifest sau.

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

`k8s/secret.yaml` — **thay giá trị thật**, không commit file này lên git:

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
  NEXT_PUBLIC_SERVER_URL: "https://vcpp.vn"
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

`k8s/deployment.yaml`:

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
          image: ap-singapore-1.ocir.io/<tenancy-namespace>/website-deploy:v1.0.0
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

1. Cloudflare Dashboard → chọn zone **vcpp.vn**
2. **SSL/TLS** → **Origin Server** → **Create Certificate**
3. Hostnames:
   - `vcpp.vn`
   - `*.vcpp.vn`
4. Validity: 15 years (mặc định)
5. Download:
   - `origin.pem` (certificate)
   - `origin.key` (private key)

### 8.2 Tạo Kubernetes TLS Secret

```bash
kubectl create secret tls website-tls \
  --namespace website \
  --cert=origin.pem \
  --key=origin.key
```

### 8.3 Ingress

`k8s/ingress.yaml`:

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
        - vcpp.vn
        - www.vcpp.vn
      secretName: website-tls
  rules:
    - host: vcpp.vn
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: website-deploy
                port:
                  number: 80
    - host: www.vcpp.vn
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

## 10. Cấu hình Cloudflare DNS cho vcpp.vn

Cloudflare Dashboard → **vcpp.vn** → **DNS** → **Records**.

### 10.1 Bản ghi apex (bắt buộc)

| Type | Name | Content | Proxy status | TTL |
|------|------|---------|--------------|-----|
| **A** | `@` | `<EXTERNAL-IP của LB>` | **Proxied** (đám mây cam) | Auto |

### 10.2 Bản ghi www (khuyến nghị)

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| **CNAME** | `www` | `vcpp.vn` | **Proxied** |

### 10.3 Redirect www → apex

Cloudflare → **Rules** → **Redirect Rules** → Create rule:

- **If:** Hostname equals `www.vcpp.vn`
- **Then:** Dynamic redirect → `https://vcpp.vn${uri.path}` — Status **301**

### 10.4 Lưu ý khi Proxied

- `dig vcpp.vn` sẽ trả về **IP Cloudflare**, không phải IP OCI — điều này **bình thường**
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
NEXT_PUBLIC_SERVER_URL=https://vcpp.vn
```

### 12.1 Cập nhật ConfigMap và rollout

```bash
kubectl apply -f k8s/configmap.yaml
kubectl rollout restart deployment/website-deploy -n website
```

### 12.2 Rebuild image nếu URL bake lúc build

Dockerfile truyền `NEXT_PUBLIC_SERVER_URL` lúc build. Nếu đổi domain, **build lại image** với:

```bash
--build-arg NEXT_PUBLIC_SERVER_URL="https://vcpp.vn"
```

Rồi push tag mới và cập nhật `deployment.yaml`.

---

## 13. Kiểm tra sau triển khai

### 13.1 Checklist

- [ ] `https://vcpp.vn` mở được, certificate hợp lệ
- [ ] `https://vcpp.vn/admin` — đăng nhập được
- [ ] Tạo/sửa bài viết, publish OK
- [ ] Upload ảnh media hiển thị đúng
- [ ] `www.vcpp.vn` redirect về `vcpp.vn`
- [ ] Không có mixed content (http asset trên trang https)
- [ ] Pod `Running`, PVC `Bound`

### 13.2 Lệnh kiểm tra

```bash
# HTTPS header
curl -I https://vcpp.vn

# Pod logs
kubectl logs -n website -l app=website-deploy --tail=100

# Ingress events
kubectl describe ingress -n website website-ingress
```

### 13.3 Tạo admin user lần đầu

Truy cập `https://vcpp.vn/admin` — Payload sẽ hướng dẫn tạo user đầu tiên nếu database trống.

> **Không** chạy seed production trừ khi chấp nhận xóa toàn bộ dữ liệu (seed destructive).

---

## 14. Cron / Scheduled Publish

Payload hỗ trợ scheduled publish qua jobs queue. Trên K8s, tạo CronJob gọi endpoint định kỳ.

`k8s/cronjob.yaml` (điều chỉnh URL/secret theo cấu hình Payload của bạn):

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
                    "https://vcpp.vn/api/payload-jobs/run"
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
| Cloudflare **525** SSL handshake | Origin cert sai hostname | Tạo lại origin cert cho `vcpp.vn` |
| Admin load, API lỗi | Cache Cloudflare | Bypass cache `/admin`, `/api/` |
| Ảnh upload mất sau restart | Không có PVC | Kiểm tra `website-media-pvc` mounted |
| CORS / link sai | `NEXT_PUBLIC_SERVER_URL` sai | Set `https://vcpp.vn`, rebuild nếu cần |
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
# Kết nối OKE
cd scripts/bastion && ./connect-oke.sh

# Deploy toàn bộ
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml          # tạo local, không commit
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/pvc-media.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Cập nhật version mới
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
- Script bastion trong repo: `scripts/bastion/setup-bastion.sh`, `scripts/bastion/connect-oke.sh`
- Docker production: `Dockerfile`, `docker-compose.prod.yml`
- Biến môi trường mẫu: `.env.example`

---

## Thứ tự triển khai tóm tắt

```
1.  ./connect-oke.sh
2.  Deploy MongoDB
3.  docker build + push OCIR
4.  kubectl create secret ocir-secret
5.  kubectl apply k8s/* (namespace, secret, configmap, pvc, deployment, service)
6.  Cài NGINX Ingress (nếu chưa có)
7.  Tạo Cloudflare Origin Certificate → kubectl create secret tls
8.  kubectl apply ingress.yaml
9.  Lấy EXTERNAL-IP của LB
10. Cloudflare DNS: A @ → IP (Proxied)
11. Cloudflare SSL: Full (strict) + Cache Rules
12. Kiểm tra https://vcpp.vn và /admin
```
