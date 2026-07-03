# Giải pháp website-deploy

Tài liệu mô tả **tổng quan giải pháp** của repository `website-deploy`: mục tiêu, kiến trúc ứng dụng, hạ tầng triển khai và các thành phần chính.

Để triển khai production từng bước, xem [DEPLOY-OKE-CLOUDFLARE.md](./DEPLOY-OKE-CLOUDFLARE.md).

---

## 1. Mục tiêu giải pháp

`website-deploy` là **website doanh nghiệp / blog / cổng thông tin** kết hợp:

| Lớp | Công nghệ | Vai trò |
|-----|-----------|---------|
| **CMS & API** | [Payload CMS](https://payloadcms.com) 4.x | Quản trị nội dung, admin panel, REST/GraphQL API |
| **Frontend** | [Next.js](https://nextjs.org) 16 (App Router) | Website công khai, SSR/SSG, preview |
| **Database** | MongoDB | Lưu trữ nội dung, người dùng, metadata |
| **Hạ tầng** | Oracle Kubernetes Engine (OKE) + Cloudflare | Chạy container, CDN, DNS, bảo mật edge |

Domain production mặc định: **vcpp.vn**.

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                        Người dùng / Biên tập                    │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
        https://vcpp.vn              /admin (Payload)
                │                             │
                ▼                             │
┌───────────────────────────┐                 │
│  Cloudflare               │                 │
│  DNS · CDN · TLS edge     │                 │
│  DDoS protection          │                 │
└─────────────┬─────────────┘                 │
              │ HTTPS (Full strict)           │
              ▼                               │
┌───────────────────────────┐                 │
│  OCI Load Balancer        │                 │
│  (public IP)              │                 │
└─────────────┬─────────────┘                 │
              ▼                               │
┌───────────────────────────┐                 │
│  NGINX Ingress Controller │                 │
│  (namespace: ingress-nginx)               │
└─────────────┬─────────────┘                 │
              ▼                               │
┌───────────────────────────┐◄────────────────┘
│  Pod: website-deploy      │
│  Next.js + Payload        │
│  port 3000                │
│  ┌─────────────────────┐  │
│  │ PVC: public/media   │  │  ← upload ảnh/file
│  └─────────────────────┘  │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│  MongoDB                  │
│  (in-cluster StatefulSet  │
│   hoặc managed DB)        │
└───────────────────────────┘
```

**Luồng request công khai:** Trình duyệt → Cloudflare (TLS, cache) → Load Balancer OCI → Ingress NGINX → Service `website-deploy` → Pod Next.js/Payload.

**Luồng quản trị:** Biên tập viên truy cập `/admin`, xác thực qua collection `users`, chỉnh sửa nội dung; thay đổi được đồng bộ ra frontend qua on-demand revalidation.

---

## 3. Ứng dụng (monolith Next.js + Payload)

Ứng dụng chạy **một process Node.js duy nhất** (`node server.js` từ Next.js standalone output), phục vụ cả website và admin.

### 3.1 Collections (dữ liệu chính)

| Collection | Mô tả |
|------------|-------|
| **Pages** | Trang tĩnh, layout builder, draft/publish |
| **Posts** | Bài viết blog/tin tức, có category, SEO |
| **Media** | Upload ảnh, video, file; resize, focal point |
| **Categories** | Phân loại bài viết (nested docs) |
| **Users** | Xác thực admin, phân quyền |
| **folders** | Tổ chức thư mục media |

### 3.2 Globals

| Global | Mô tả |
|--------|-------|
| **Header** | Menu, logo, liên kết điều hướng |
| **Footer** | Liên kết chân trang, thông tin liên hệ |

### 3.3 Plugins Payload

- **SEO** — meta title, description, Open Graph từ admin
- **Search** — tìm kiếm bài viết (SSR)
- **Redirects** — chuyển hướng URL cũ → mới
- **Form Builder** — form liên hệ / đăng ký
- **Nested Docs** — category phân cấp

### 3.4 Layout Builder (blocks)

Trang và bài viết dùng các block có sẵn:

- Hero, Content, Media, Call To Action, Archive, Banner, Code, Form, Related Posts

Mỗi block có config (Payload) và component React (frontend).

### 3.5 Tính năng biên tập

| Tính năng | Cách hoạt động |
|-----------|----------------|
| **Draft & Publish** | Versions + `_status`; nội dung nháp không hiển thị công khai |
| **Draft Preview** | URL preview có `PREVIEW_SECRET` |
| **Live Preview** | Xem thay đổi real-time trong admin |
| **On-demand Revalidation** | Hook `afterChange` gọi Next.js revalidate khi publish |
| **Scheduled Publish** | Jobs queue + CronJob K8s gọi `/api/payload-jobs/run` mỗi 5 phút |

### 3.6 Frontend

- **Next.js App Router** — route groups `(frontend)` và `(payload)`
- **Tailwind CSS** + **shadcn/ui**
- **Lexical** rich text editor
- Dark mode, Admin Bar, sitemap (`next-sitemap`)

### 3.7 API

- REST: `/api/*` (Payload)
- GraphQL: `/api/graphql`
- Admin: `/admin`

---

## 4. Kiến trúc triển khai Kubernetes

Namespace: **`website`**.

| Tài nguyên K8s | File | Vai trò |
|----------------|------|---------|
| Namespace | `k8s/namespace.yaml` | Cô lập workload |
| Deployment | `k8s/deployment.yaml` | Pod ứng dụng (1 replica mặc định) |
| Service | `k8s/service.yaml` | ClusterIP, port 80 → 3000 |
| Ingress | `k8s/ingress.yaml` | Route domain, TLS origin |
| PVC | `k8s/pvc-media.yaml` | 10Gi cho `public/media` |
| StatefulSet + Service | `k8s/mongo.yaml` | MongoDB 7 in-cluster (20Gi) |
| CronJob | `k8s/cronjob.yaml` | Scheduled publish mỗi 5 phút |
| ConfigMap | `k8s/configmap.yaml` | `NEXT_PUBLIC_SERVER_URL` |
| Secret | tạo khi deploy | `DATABASE_URL`, `PAYLOAD_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET` |

### 4.1 Docker image

- **Dockerfile** multi-stage: `deps` → `builder` → `runner`
- Build cần `DATABASE_URL` và `PAYLOAD_SECRET` (static generation truy vấn DB lúc build)
- Output: Next.js **standalone** (`output: 'standalone'` trong `next.config.ts`)
- Image lưu trên **OCIR** (Oracle Container Registry)

### 4.2 Kết nối cluster private

OKE dùng **private API endpoint**. Truy cập `kubectl` qua:

- `scripts/bastion/setup-bastion.sh` — thiết lập lần đầu
- `scripts/bastion/connect-oke.sh` — các lần sau (SSH tunnel `127.0.0.1:6443`)

### 4.3 Cloudflare

| Hạng mục | Cấu hình |
|----------|----------|
| DNS | A record → public IP Load Balancer |
| SSL/TLS | Full (strict) + Origin Certificate trên Ingress |
| Cache | Tùy chỉnh theo static/API |
| WebSocket | Bật cho Live Preview (nếu dùng) |

### 4.4 Script triển khai tự động

`scripts/deploy-oke.sh` thực hiện tuần tự:

1. Kết nối kubectl qua Bastion
2. Deploy MongoDB (tùy chọn)
3. Build + push image OCIR
4. Tạo secret pull image + app secrets
5. Apply manifests K8s
6. Cài NGINX Ingress Controller
7. TLS origin certificate
8. Apply Ingress
9. CronJob
10. Kiểm tra health

Cấu hình: copy `scripts/deploy-oke.env.example` → `production.env` (không commit).

### 4.5 Sửa code và deploy lại

Sau lần triển khai đầu tiên, mỗi khi sửa code cần **build image mới → push OCIR → rollout pod**:

```bash
# Tăng IMAGE_TAG trong production.env, rồi:
./scripts/redeploy-oke.sh
```

**Điều kiện quan trọng:** `docker build` phải kết nối được MongoDB (`BUILD_DATABASE_URL` trong `production.env`). Thường dùng Mongo local (`docker compose up mongo`) hoặc `kubectl port-forward` tới Mongo trên cluster.

Hướng dẫn chi tiết (build thủ công, rollback, xử lý lỗi): [DEPLOY-OKE-CLOUDFLARE.md — mục 5.6](./DEPLOY-OKE-CLOUDFLARE.md#56-workflow-sửa-code-và-deploy-lại).

---

## 5. Cấu trúc thư mục chính

```
website-deploy/
├── src/
│   ├── app/
│   │   ├── (frontend)/     # Website công khai
│   │   └── (payload)/      # Admin + API routes
│   ├── blocks/             # Layout builder components
│   ├── collections/        # Pages, Posts, Media, Users, ...
│   ├── components/         # UI dùng chung
│   ├── Header/, Footer/    # Globals config + components
│   ├── plugins/            # Payload plugins
│   ├── payload.config.ts   # Cấu hình Payload chính
│   └── utilities/          # Helper functions
├── k8s/                    # Manifests Kubernetes
├── scripts/
│   ├── deploy-oke.sh       # Triển khai production
│   └── bastion/            # Kết nối OKE private cluster
├── docs/
│   ├── GIAI-PHAP.md        # Tài liệu này
│   └── DEPLOY-OKE-CLOUDFLARE.md  # Hướng dẫn deploy chi tiết
├── Dockerfile
├── docker-compose.yml      # Dev local với MongoDB
└── package.json
```

---

## 6. Biến môi trường

| Biến | Mục đích |
|------|----------|
| `DATABASE_URL` | Connection string MongoDB |
| `PAYLOAD_SECRET` | Mã hóa JWT, session (≥ 32 ký tự) |
| `NEXT_PUBLIC_SERVER_URL` | URL công khai, không có `/` cuối (vd. `https://vcpp.vn`) |
| `CRON_SECRET` | Xác thực CronJob gọi jobs API |
| `PREVIEW_SECRET` | Xác thực draft preview |

Tham khảo mẫu: `.env.example`, `scripts/deploy-oke.env.example`.

---

## 7. Môi trường phát triển

### Local (khuyến nghị)

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Mở `http://localhost:3000`, tạo user admin, có thể seed dữ liệu mẫu từ admin panel.

### Docker Compose

```bash
docker-compose up
```

Chạy Node 18 + MongoDB; phù hợp làm quen nhanh, production dùng Dockerfile standalone.

### Kiểm thử

- **Vitest** — integration tests (`tests/int/`)
- **Playwright** — E2E admin + frontend (`tests/e2e/`)

```bash
pnpm test
```

---

## 8. Bảo mật & vận hành

| Khía cạnh | Giải pháp |
|-----------|-----------|
| **TLS** | Cloudflare edge + Origin cert trên Ingress |
| **Secrets** | K8s Secret, không commit `production.env` |
| **Cluster API** | Private endpoint, truy cập qua Bastion |
| **Media** | PVC persistent, mount `/app/public/media` |
| **Cron jobs** | Bearer token `CRON_SECRET` |
| **Access control** | Published content public; draft chỉ user đăng nhập |

---

## 9. Luồng cập nhật nội dung (end-to-end)

```
Biên tập viên sửa Page/Post trong /admin
        │
        ▼
Lưu draft hoặc Publish
        │
        ├── Draft → Preview URL (PREVIEW_SECRET)
        │
        └── Published → afterChange hook
                │
                ▼
        Next.js on-demand revalidation
                │
                ▼
        Trang công khai cập nhật (có thể qua Cloudflare cache)
```

Upload media → lưu `public/media` (PVC trên K8s) → phục vụ qua `/api/media/file/*`.

---

## 10. Phụ thuộc chính

| Package | Phiên bản (ước lượng) |
|---------|------------------------|
| payload | 4.0.0-canary.3 |
| next | 16.2.7 |
| react | 19.2.6 |
| @payloadcms/db-mongodb | 4.0.0-canary.3 |
| Node.js | ≥ 24.15.0 |
| pnpm | ^9 hoặc ^10 |

---

## 11. Tài liệu liên quan

| Tài liệu | Nội dung |
|----------|----------|
| [README.md](../README.md) | Hướng dẫn Payload Website Template (tiếng Anh) |
| [DEPLOY-OKE-CLOUDFLARE.md](./DEPLOY-OKE-CLOUDFLARE.md) | Triển khai OKE + Cloudflare từng bước |
| [Payload Docs](https://payloadcms.com/docs) | Tài liệu chính thức Payload CMS |
| [Next.js Docs](https://nextjs.org/docs) | App Router, caching, deployment |

---

## 12. Tóm tắt

`website-deploy` là giải pháp **headless CMS + website** trên nền **Payload + Next.js**, triển khai **self-hosted** trên **Oracle Cloud (OKE)** với **MongoDB**, media trên **PVC**, expose ra internet qua **Load Balancer + NGINX Ingress**, và bảo vệ/phân phối qua **Cloudflare**. Repo bao gồm mã nguồn ứng dụng, Dockerfile production, manifests Kubernetes và script tự động hóa deploy — phù hợp cho website doanh nghiệp có workflow biên tập, SEO, tìm kiếm và lên lịch xuất bản.
