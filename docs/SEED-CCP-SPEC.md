# Spec: Seed dữ liệu website CCP — Công ty Bù trừ Chứng khoán Việt Nam

> **Mục đích:** Tài liệu này hướng dẫn Cursor (hoặc developer) implement bộ seed **độc lập** cho website CCP — công ty con của [VSDC](https://vsd.vn) (Tổng công ty Lưu ký và Bù trừ Chứng khoán Việt Nam), vận hành cơ chế **Đối tác Bù trừ Trung tâm (CCP)** cho thị trường chứng khoán cơ sở (go-live dự kiến Q1/2027).

---

## 1. Bối cảnh & phạm vi

### 1.1 Tổ chức

| Thuộc tính | Giá trị |
|------------|---------|
| Tên đầy đủ (VI) | Công ty TNHH Một thành viên Bù trừ Chứng khoán Việt Nam |
| Tên viết tắt | CCP VN / BTCK VN |
| Tên EN | Vietnam Securities Clearing Corporation (subsidiary) |
| Công ty mẹ | Tổng công ty Lưu ký và Bù trừ Chứng khoán Việt Nam (VSDC) |
| Website mẹ | https://vsd.vn |
| Vai trò | CCP cho thị trường cơ sở — novation, bù trừ đa phương, quản trị rủi ro, quỹ bù trừ |
| Đối tượng | Thành viên bù trừ (CTCK, ngân hàng), cơ quan quản lý, báo chí — **không** target NĐT cá nhân |

### 1.2 Phạm vi seed

- **Tạo mới:** `src/endpoints/seed-ccp/` (không sửa/xóa logic seed demo cũ trừ khi được yêu cầu)
- **Endpoint:** `POST /next/seed-ccp` (auth required, pattern giống `src/app/(frontend)/next/seed/route.ts`)
- **Nút Admin (tuỳ chọn):** `SeedCcpButton` hoặc mở rộng `SeedButton` với 2 lựa chọn
- **Locale:** `vi` (default) + bản dịch `en` cho mọi page/post có `localized: true`
- **Destructive:** Giống seed hiện tại — xóa collections liên quan trước khi seed (cảnh báo trong UI)

### 1.3 Out of scope (phase seed)

- Widget giá live / API thị trường
- Member portal login
- Upload PDF quy chế thật (dùng link placeholder hoặc rich text mô tả)
- Custom blocks mới (timeline, waterfall diagram) — dùng **blocks có sẵn**

---

## 2. Ràng buộc kỹ thuật (đọc trước khi code)

### 2.1 Payload CMS — collections & globals

Tham chiếu: `src/payload.config.ts`

| Collection / Global | Dùng trong seed CCP |
|---------------------|---------------------|
| `pages` | 11 trang (xem mục 4) |
| `posts` | 12 bài tin/thông báo |
| `categories` | 5 danh mục tin |
| `media` | 6–8 ảnh hero/placeholder |
| `forms` | 1 form liên hệ thành viên |
| `users` | 1 user demo (tuỳ chọn, cho author posts) |
| `header` | 6 nav items (maxRows: 6) |
| `footer` | 6 nav items (maxRows: 6) |

**Collections seed xóa (giống seed cũ):** `categories`, `media`, `pages`, `posts`, `forms`, `form-submissions`, `search` + versions nếu có.

### 2.2 Pages — blocks & hero

Tham chiếu: `src/collections/Pages/index.ts`, `src/heros/config.ts`

**Hero `type`:** `none` | `lowImpact` | `mediumImpact` | `highImpact`

| Hero type | Cần `media` | Dùng khi |
|-----------|-------------|----------|
| `highImpact` | ✅ required | Trang chủ |
| `mediumImpact` | ✅ required | Giới thiệu, Mô hình CCP |
| `lowImpact` | ❌ | Trang nội dung phụ |
| `none` | ❌ | Liên hệ (form-focused) |

**Layout blocks (pages only):**

| blockType | slug | Dùng cho |
|-----------|------|----------|
| `content` | Content | Text đa cột, sections |
| `cta` | CallToAction | CTA cuối trang, link VSDC |
| `mediaBlock` | MediaBlock | Ảnh minh hoạ |
| `archive` | Archive | Danh sách posts (trang chủ, tin tức embed) |
| `formBlock` | FormBlock | Trang liên hệ |

**Posts `content` blocks:** `banner`, `code`, `mediaBlock` (Banner dùng cho disclaimer pháp lý).

### 2.3 Routing frontend

| Slug page | URL |
|-----------|-----|
| `home` | `/` (không nằm trong `[slug]` static params) |
| `{slug}` | `/{slug}` |
| posts | `/posts`, `/posts/{slug}` |

### 2.4 Localization

- `defaultLocale: 'vi'`, `fallback: true`
- Flow seed:
  1. `payload.create({ collection: 'pages', data: {...} })` — locale mặc định `vi`
  2. `payload.update({ collection: 'pages', id, locale: 'en', data: {...} })` — bản tiếng Anh
- Fields localized: `title`, `slug` (slugField), `hero`, `layout`, `meta`
- Categories **không** localized — title tiếng Việt, slug ASCII

### 2.5 Link trong nav / CTA

Tham chiếu: `src/fields/link.ts`

```typescript
// Internal reference (sau khi page đã create — dùng page.id)
{
  type: 'reference',
  reference: { relationTo: 'pages', value: pageId },
  label: 'Giới thiệu',
  newTab: false,
}

// Custom URL (external hoặc /posts)
{
  type: 'custom',
  url: 'https://vsd.vn',
  label: 'VSDC.vn',
  newTab: true,
}
```

**Lưu ý:** Header/Footer globals **không localized** — label tiếng Việt; site EN dùng LocaleSelector hiện có cho content pages.

---

## 3. Cấu trúc file cần tạo

```
src/endpoints/seed-ccp/
├── index.ts                 # Orchestrator chính — export seedCcp()
├── helpers/
│   ├── lexical.ts           # Builder Lexical JSON (BẮT BUỘC — tránh copy paste)
│   ├── ids.ts               # generateBlockId() — random hex 24 chars
│   └── types.ts             # Shared arg types (media refs, page refs)
├── media/
│   ├── hero-home.ts         # alt text metadata
│   ├── hero-about.ts
│   └── ...
├── categories.ts            # 5 categories
├── form-member-contact.ts   # Form liên hệ thành viên
├── pages/
│   ├── home.ts
│   ├── gioi-thieu.ts
│   ├── mo-hinh-ccp.ts
│   ├── quan-tri-rui-ro.ts
│   ├── thanh-vien.ts
│   ├── quy-che.ts
│   ├── cong-bo-thong-tin.ts
│   ├── lo-trinh.ts
│   ├── dao-tao.ts
│   ├── he-thong.ts
│   └── lien-he.ts
├── posts/
│   ├── post-01.ts … post-12.ts
├── globals/
│   ├── header.ts            # Factory nhận page IDs
│   └── footer.ts
└── images.ts                # fetchFileByURL() — reuse từ seed cũ hoặc URLs mới

src/app/(frontend)/next/seed-ccp/
└── route.ts                 # POST handler
```

---

## 4. Helper Lexical (implement trước)

File: `src/endpoints/seed-ccp/helpers/lexical.ts`

Implement các factory sau để mọi page/post gọi chung:

```typescript
export function lexicalRoot(children: LexicalNode[]): LexicalRoot
export function h1(text: string): LexicalNode
export function h2(text: string): LexicalNode
export function h3(text: string): LexicalNode
export function h4(text: string): LexicalNode
export function paragraph(...children: (LexicalNode | string)[]): LexicalNode
export function text(content: string, format?: 0 | 1): LexicalNode  // 1 = bold
export function link(label: string, url: string, newTab?: boolean): LexicalNode
export function bulletList(items: string[]): LexicalNode
export function orderedList(items: string[]): LexicalNode
```

**Quy ước:** Mọi `root` phải có `direction: 'ltr'`, `format: ''`, `indent: 0`, `version: 1`.

**Ví dụ sử dụng:**

```typescript
richText: lexicalRoot([
  h1('Đối tác Bù trừ Trung tâm cho thị trường chứng khoán cơ sở Việt Nam'),
  paragraph(
    'Công ty Bù trừ Chứng khoán Việt Nam — công ty con của ',
    link('VSDC', 'https://vsd.vn', true),
    ' — chuẩn bị vận hành cơ chế CCP theo lộ trình Q1/2027.',
  ),
])
```

Copy format node từ `src/endpoints/seed/home.ts` nếu cần tham chiếu chính xác.

---

## 5. Media

### 5.1 Ảnh cần seed

| File key | alt (VI) | Dùng cho |
|----------|----------|----------|
| `heroHome` | Tòa nhà tài chính hiện đại — hạ tầng thị trường vốn | Trang chủ hero |
| `heroAbout` | Hội nghị thị trường chứng khoán — đối tác institution | Giới thiệu |
| `heroModel` | Sơ đồ luồng giao dịch chứng khoán | Mô hình CCP |
| `heroRisk` | Biểu đồ quản trị rủi ro tài chính | Quản trị rủi ro |
| `heroRoadmap` | Lộ trình phát triển — timeline | Lộ trình |
| `metaDefault` | Logo placeholder CCP VN | meta.image fallback |

### 5.2 Nguồn ảnh

- **Option A (khuyên dùng):** Reuse `fetchFileByURL` từ `src/endpoints/seed/index.ts` với URLs Unsplash/Pexels (finance, corporate, abstract blue):
  - `https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920` (chart)
  - `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920` (building)
- **Option B:** Giữ pattern Payload template URLs (kém phù hợp brand CCP)

Mỗi `payload.create({ collection: 'media', data: { alt }, file })` trả về `Media` doc dùng cho hero/blocks.

---

## 6. Categories (5)

File: `src/endpoints/seed-ccp/categories.ts`

| title | slug | Mô tả |
|-------|------|-------|
| Tin CCP | `tin-ccp` | Thông tin nội bộ CCP, thành lập, sự kiện |
| Thông báo thành viên | `thong-bao-thanh-vien` | Cấp/thu hồi GCN thành viên bù trừ |
| Quỹ bù trừ | `quy-bu-tru` | Báo cáo quỹ bù trừ, quỹ thanh toán |
| Pháp lý | `phap-ly` | Thông tư, quy chế, sửa đổi |
| Đào tạo & Kiểm thử | `dao-tao-kiem-thu` | Tập huấn, UAT, dry-run |

---

## 7. Pages — chi tiết từng trang

Quy ước chung mỗi page:
- `_status: 'published'`
- `publishedAt`: ISO date gần hiện tại
- `meta.title`, `meta.description` — có cả VI và EN khi update locale

---

### 7.1 Trang chủ — `home`

| Field | VI | EN |
|-------|----|----|
| `title` | Trang chủ | Home |
| `slug` | `home` | `home` |

**Hero:** `type: 'highImpact'`, `media: heroHome`

**Hero richText (VI):**
- H1: `Đối tác Bù trừ Trung tâm cho thị trường chứng khoán cơ sở Việt Nam`
- Paragraph: `Công ty Bù trừ Chứng khoán Việt Nam — công ty con Tổng công ty Lưu ký và Bù trừ Chứng khoán Việt Nam (VSDC) — triển khai cơ chế CCP theo lộ trình chính thức vận hành quý I/2027.`

**Hero links:**
1. `{ type: 'custom', label: 'Tìm hiểu mô hình CCP', url: '/mo-hinh-ccp', appearance: 'default' }` → đổi thành reference sau create
2. `{ type: 'custom', label: 'VSDC.vn', url: 'https://vsd.vn', newTab: true, appearance: 'outline' }`

**Layout blocks (theo thứ tự):**

#### Block 1 — `content` (3 cột oneThird)

| Cột | H3 | Nội dung |
|-----|-----|----------|
| 1 | An toàn hệ thống | CCP đứng giữa giao dịch, thực hiện novation và bù trừ đa phương, giảm rủi ro đối tác không thanh toán. |
| 2 | Minh bạch PFMI | Công bố thông tin theo khung PFMI (CPSS-IOSCO), báo cáo quỹ bù trừ định kỳ, quy trình xử lý vi phạm công khai. |
| 3 | Sẵn sàng thành viên | Lộ trình tập huấn, kiểm thử hệ thống và cấp Giấy chứng nhận thành viên bù trừ từ 2026. |

#### Block 2 — `content` (1 cột full) — Số liệu snapshot

H2: `Số liệu nổi bật`

Bullet list (placeholder — cập nhật sau go-live):
- Thành viên bù trừ (dự kiến): **đang tuyển hội đủ điều kiện**
- Lộ trình vận hành: **Quý I/2027**
- Thuộc: **VSDC — 100% vốn nhà nước**
- Chuẩn mực: **PFMI / IOSCO**

#### Block 3 — `archive`

```typescript
{
  blockType: 'archive',
  populateBy: 'collection',
  relationTo: 'posts',
  categories: [/* ids: tin-ccp, thong-bao-thanh-vien */],
  limit: 5,
  introContent: h2('Tin tức & Thông báo'),
}
```

#### Block 4 — `content` (full) — Timeline lộ trình

H2: `Lộ trình triển khai CCP`

Ordered list:
1. Q4/2025 — Phê duyệt Đề án thành lập Công ty Bù trừ Chứng khoán Việt Nam
2. Q1/2026 — Ban hành Điều lệ, quy chế tài chính và nghiệp vụ
3. 2026 — Tập huấn, kiểm thử song phương với thành viên thị trường
4. Q1/2027 — Vận hành chính thức cơ chế CCP thị trường cơ sở

`enableLink: true` → link `/lo-trinh`, label `Xem chi tiết lộ trình`

#### Block 5 — `cta`

H3: `Thuộc hệ sinh thái VSDC`
Paragraph: `Dịch vụ lưu ký, đăng ký chứng khoán và bù trừ đa thị trường được cung cấp bởi Tổng công ty Lưu ký và Bù trừ Chứng khoán Việt Nam.`
Links: `VSDC.vn` (https://vsd.vn, newTab) | `Liên hệ CCP` (/lien-he)

**meta (VI):** title `Công ty Bù trừ Chứng khoán Việt Nam — CCP thị trường cơ sở`, description ~155 ký tự về CCP VN thuộc VSDC.

---

### 7.2 Giới thiệu — `gioi-thieu`

| Field | VI | EN |
|-------|----|----|
| `title` | Giới thiệu | About |
| `slug` | `gioi-thieu` | `about` |

**Hero:** `mediumImpact`, `heroAbout`

**Hero H1 (VI):** `Công ty Bù trừ Chứng khoán Việt Nam`

**Layout:**

1. **content (full)** — Vai trò CCP
   - H2: CCP là gì?
   - Paragraph giải thích novation: CCP thay thế vai trò đối tác, đảm bảo thanh toán even if member defaults
   - H2: Vị trí trong hệ thống
   - Paragraph: Sở GDTT → Khớp lệnh → VSDC (lưu ký) → **CCP (bù trừ)** → Thanh toán (T+)
   - banner-style paragraph (bold): *Công ty được thành lập là công ty con 100% vốn của VSDC, chuyên thực hiện chức năng CCP cho thị trường cơ sở.*

2. **content (2 cột half)**
   - Cột 1 H3: Tầm nhìn — *Trở thành CCP đạt chuẩn quốc tế, góp phần nâng hạng thị trường chứng khoán Việt Nam.*
   - Cột 2 H3: Sứ mệnh — *Giảm rủi ro thanh toán, tăng minh bạch và niềm tin của nhà đầu tư trong nước và quốc tế.*

3. **content (full)** — Ban lãnh đạo (placeholder)
   - H2: Ban lãnh đạo
   - Paragraph: *Thông tin Ban Giám đốc và Hội đồng thành viên sẽ được cập nhật sau khi công ty chính thức đi vào hoạt động (Q1/2026).*

4. **cta** — Link `/mo-hinh-ccp` + `/quan-tri-rui-ro`

---

### 7.3 Mô hình CCP — `mo-hinh-ccp`

| Field | VI | EN |
|-------|----|----|
| `title` | Mô hình CCP | CCP Model |
| `slug` | `mo-hinh-ccp` | `ccp-model` |

**Hero:** `mediumImpact`, `heroModel`

**Hero H1:** `Mô hình Đối tác Bù trừ Trung tâm`

**Layout:**

1. **content (full)** — Novation
   - H2: Novation (Thay thế hợp đồng)
   - Paragraph: Sau khi giao dịch khớp lệnh tại Sở, CCP trở thành bên mua đối với người bán và bên bán đối với người mua.
   - bulletList 3 items: Giảm rủi ro đối tác | Tăng hiệu quả thanh toán | Chuẩn hoá quy trình

2. **content (full)** — Netting
   - H2: Bù trừ đa phương (Multilateral Netting)
   - Paragraph: Tổng hợp vị thế mua/bán của thành viên, chỉ thanh toán phần ròng (net).

3. **content (2 cột half)** — Trước vs Sau CCP
   - Cột 1 H3: Trước CCP — Rủi ro đối ứng từng cặp giao dịch bilaterally
   - Cột 2 H3: Sau CCP — Rủi ro tập trung tại CCP, quản lý bằng margin & quỹ

4. **content (full)** — Phạm vi sản phẩm
   - H2: Phạm vi áp dụng (dự kiến)
   - bulletList: Cổ phiếu niêm yết HOSE/HNX/UPCoM | Chứng quyền | Trái phiếu niêm yết (theo quy định SSC)

5. **mediaBlock** — heroModel (minh hoạ)

6. **cta** — `Quản trị rủi ro` → `/quan-tri-rui-ro`

---

### 7.4 Quản trị rủi ro — `quan-tri-rui-ro`

| Field | VI | EN |
|-------|----|----|
| `title` | Quản trị rủi ro | Risk Management |
| `slug` | `quan-tri-rui-ro` | `risk-management` |

**Hero:** `lowImpact` (no media)

**Hero H1:** `Khung quản trị rủi ro CCP`

**Layout:**

1. **content (full)**
   - H2: Margin
   - Paragraph: Initial Margin (IM) và Variation Margin (VM) — thu/collected hàng ngày theo vị thế ròng.
   - H2: Haircut & Stress test
   - Paragraph: Áp dụng tỷ lệ haircut theo loại tài sản; stress test định kỳ theo kịch bản SSC.

2. **content (full)** — Default Waterfall
   - H2: Trình tự xử lý vi phạm (Default Waterfall)
   - orderedList:
     1. Tài sản ký quỹ của thành viên vi phạm
     2. Quỹ đóng góp của thành viên vi phạm (default fund contribution)
     3. Quỹ bù trừ chung (mutualized default fund)
     4. Vốn CCP và công cụ tài chính khác theo quy chế

3. **content (full)**
   - H2: Giám sát vị thế tập trung
   - Paragraph: Theo dõi concentration risk theo mã chứng khoán và thành viên.

4. **cta** — link `/cong-bo-thong-tin` label `Xem công bố PFMI`

---

### 7.5 Thành viên bù trừ — `thanh-vien`

| Field | VI | EN |
|-------|----|----|
| `title` | Thành viên bù trừ | Clearing Members |
| `slug` | `thanh-vien` | `clearing-members` |

**Hero:** `lowImpact`, H1: `Thành viên bù trừ`

**Layout:**

1. **content (full)** — Tiêu chí
   - H2: Tiêu chí tham gia (tóm tắt)
   - bulletList: CTCK / Ngân hàng đủ điều kiện theo quy định SSC | Đủ năng lực tài chính | Hạ tầng IT kết nối VSDC/CCP | Nhân sự nghiệp vụ bù trừ được đào tạo

2. **content (full)** — Danh sách (placeholder)
   - H2: Danh sách thành viên
   - Paragraph: *Danh sách thành viên bù trừ sẽ được công bố khi bắt đầu cấp Giấy chứng nhận (từ Q1/2027).*
   - Paragraph italic: VSDC đã cấp GCN thành viên bù trừ phái sinh — tham khảo tin tại vsd.vn.

3. **content (full)** — Quy trình gia nhập
   - H2: Quy trình gia nhập
   - orderedList: Nộp hồ sơ → Thẩm định → Ký thỏa thuận → Kết nối hệ thống → UAT → Cấp GCN

4. **cta** — `/lien-he` label `Liên hệ bộ phận thành viên`

---

### 7.6 Quy chế & Văn bản — `quy-che`

| Field | VI | EN |
|-------|----|----|
| `title` | Quy chế & Văn bản | Rules & Regulations |
| `slug` | `quy-che` | `rules` |

**Hero:** `none` hoặc `lowImpact`, H1: `Quy chế & Văn bản pháp lý`

**Layout:**

1. **content (full)**
   - H2: Văn bản nội bộ CCP
   - bulletList với link custom (placeholder `#` hoặc `/`:
     - Điều lệ Công ty Bù trừ Chứng khoán Việt Nam (dự thảo)
     - Quy chế hoạt động CCP
     - Quy chế tài chính và quản lý quỹ bù trừ
     - Quy chế quản lý rủi ro

2. **content (full)**
   - H2: Văn bản pháp luật liên quan
   - bulletList + link external:
     - Luật Chứng khoán (sửa đổi)
     - Thông tư 119/2020/TT-BTC (thay thế dự kiến 2026)
     - Thông tư 89/2019/TT-BTC (kế toán VSDC/CCP)
     - Quyết định thành lập VSDC

3. **content (full)**
   - Paragraph disclaimer: *Văn bản chính thức có giá trị pháp lý khi được cơ quan có thẩm quyền ban hành. Website chỉ mang tính thông tin.*

---

### 7.7 Công bố thông tin / PFMI — `cong-bo-thong-tin`

| Field | VI | EN |
|-------|----|----|
| `title` | Công bố thông tin | Disclosure |
| `slug` | `cong-bo-thong-tin` | `disclosure` |

**Hero:** `lowImpact`, H1: `Công bố thông tin & PFMI`

**Layout:**

1. **content (full)**
   - H2: Khung PFMI (Principles for Financial Market Infrastructures)
   - Paragraph: CCP cam kết công bố thông tin theo 15 nguyên tắc CPSS-IOSCO, tương tự khung VSDC đã áp dụng.
   - link: `PFMI Disclosure Framework (VSDC)` → `https://vsd.vn`

2. **content (full)**
   - H2: Báo cáo định kỳ
   - bulletList:
     - Báo cáo tình hình quản lý Quỹ bù trừ (quý/tháng)
     - Báo cáo tài chính CCP
     - Thông báo thay đổi quy chế hoạt động

3. **archive** — categories `[quy-bu-tru, phap-ly]`, limit 5

---

### 7.8 Lộ trình triển khai — `lo-trinh`

| Field | VI | EN |
|-------|----|----|
| `title` | Lộ trình triển khai | Roadmap |
| `slug` | `lo-trinh` | `roadmap` |

**Hero:** `mediumImpact`, `heroRoadmap`, H1: `Lộ trình triển khai CCP`

**Layout:**

1. **content (full)** — Bảng milestone (dùng rich text)
   - H2: Các mốc chính
   - orderedList (chi tiết hơn trang chủ):
     - Q3–Q4/2025: Trình phê duyệt Đề án & bổ sung vốn VSDC
     - Q1/2026: Thành lập công ty con, ban hành Điều lệ
     - Q1–Q2/2026: SSC + VSDC ban hành Thông tư thay 119/2020
     - 2026: Đào tạo, kiểm thử, nâng cấp hạ tầng IT
     - Q1/2027: Go-live CCP thị trường cơ sở

2. **content (full)**
   - H2: Liên quan nâng hạng thị trường
   - Paragraph: Triển khai CCP là điều kiện quan trọng nâng hạng thị trường chứng khoán Việt Nam từ cận cấp 2 lên mới nổi (theo kế hoạch SSC).

3. **cta** — `/dao-tao` + `/he-thong`

---

### 7.9 Đào tạo & Kiểm thử — `dao-tao`

| Field | VI | EN |
|-------|----|----|
| `title` | Đào tạo & Kiểm thử | Training & Testing |
| `slug` | `dao-tao` | `training` |

**Hero:** `lowImpact`, H1: `Đào tạo & Kiểm thử hệ thống`

**Layout:**

1. **content (full)**
   - H2: Chương trình tập huấn 2026
   - bulletList: Nghiệp vụ CCP & novation | Quy trình margin call | Kết nối hệ thống & message spec | Diễn tập xử lý vi phạm

2. **content (full)**
   - H2: Kiểm thử (UAT)
   - Paragraph: Kiểm thử song phương với thành viên dự kiến — đăng ký qua bộ phận liên hệ.

3. **archive** — category `dao-tao-kiem-thu`, limit 5

---

### 7.10 Hệ thống & Kết nối — `he-thong`

| Field | VI | EN |
|-------|----|----|
| `title` | Hệ thống & Kết nối | Systems |
| `slug` | `he-thong` | `systems` |

**Hero:** `lowImpact`, H1: `Hệ thống kỹ thuật`

**Layout:**

1. **content (full)**
   - H2: Kiến trúc kết nối
   - Paragraph: Thành viên bù trừ ↔ Hệ thống CCP ↔ VSDC (lưu ký & thanh toán) ↔ Sở GDTT

2. **content (full)**
   - H2: Tài liệu kỹ thuật
   - Paragraph: *Tài liệu đặc tả kỹ thuật (API, file layout) dành cho thành viên — liên hệ bộ phận hỗ trợ.*

3. **content (2 cột half)**
   - SLA & cửa sổ bảo trì (placeholder)
   - Hotline kỹ thuật (placeholder)

---

### 7.11 Liên hệ — `lien-he`

| Field | VI | EN |
|-------|----|----|
| `title` | Liên hệ | Contact |
| `slug` | `lien-he` | `contact` |

**Hero:** `type: 'none'`

**Layout:**

1. **formBlock**
   - `form`: memberContactForm (xem mục 9)
   - `enableIntro: true`
   - introContent H3: `Liên hệ bộ phận CCP / Hỗ trợ thành viên`

2. **content (full)**
   - H2: Trụ sở
   - Paragraph: *Tòa nhà VSDC, [địa chỉ placeholder — cập nhật theo VSDC thực tế], Hà Nội*
   - H2: Điện thoại
   - Paragraph: Hotline nghiệp vụ: `(024) xxxx xxxx` | Hotline kỹ thuật: `(024) xxxx xxxx`
   - link VSDC: https://vsd.vn

---

## 8. Posts — 12 bài tin

Mỗi post: `_status: 'published'`, `authors: [demoAuthor]`, `heroImage`, `categories`, `publishedAt` (stagger dates trong 2025–2026), slug localized EN.

| # | slug (vi) | slug (en) | title (VI) | category | Ghi chú nội dung |
|---|-----------|-----------|------------|----------|------------------|
| 1 | `vsdc-cong-bo-ke-hoach-ccp-2027` | `vsdc-ccp-roadmap-2027` | VSDC công bố lộ trình triển khai CCP thị trường cơ sở vào Q1/2027 | tin-ccp | 3–4 đoạn, banner info |
| 2 | `de-an-thanh-lap-cong-ty-bu-tru` | `establishment-plan-clearing-co` | Trình phê duyệt Đề án thành lập Công ty Bù trừ Chứng khoán Việt Nam | tin-ccp | |
| 3 | `hoi-thao-mo-hinh-ccp-wb` | `wb-ccp-workshop` | Hội thảo trao đổi mô hình CCP với chuyên gia Ngân hàng Thế giới | tin-ccp | |
| 4 | `ssi-cap-gcn-thanh-vien-bu-tru-ps` | `ssi-clearing-member-cert` | SSI: Cấp Giấy chứng nhận thành viên bù trừ (phái sinh) — tham chiếu | thong-bao-thanh-vien | Clarify: phái sinh tại VSDC, tiền đề cơ sở |
| 5 | `tap-huan-nghiep-vu-ccp-2026` | `ccp-training-2026` | Kế hoạch tập huấn nghiệp vụ CCP cho thành viên thị trường năm 2026 | dao-tao-kiem-thu | |
| 6 | `kiem-thu-he-thong-uat-dot-1` | `uat-phase-1` | Hoàn thành đợt kiểm thử UAT đầu tiên với 3 thành viên pilot | dao-tao-kiem-thu | |
| 7 | `bao-cao-quy-bu-tru-q2-2026` | `default-fund-report-q2-2026` | Thông báo tình hình quản lý Quỹ bù trừ Quý II/2026 | quy-bu-tru | |
| 8 | `bao-cao-quy-bu-tru-thang-6-2026` | `default-fund-report-jun-2026` | Thông báo tình hình quản lý Quỹ bù trừ tháng 6/2026 | quy-bu-tru | |
| 9 | `du-thao-thong-tu-thay-119` | `draft-circular-119` | Dự thảo Thông tư thay thế 119/2020/TT-BTC — lấy ý kiến | phap-ly | banner warning: dự thảo |
| 10 | `huong-dan-ke-toan-ccp` | `ccp-accounting-guide` | Dự kiến hướng dẫn kế toán CCP thay Thông tư 89/2019 | phap-ly | |
| 11 | `ban-hanh-quy-che-hoat-dong-ccp` | `ccp-operating-rules` | Ban hành Quy chế hoạt động CCP (dự kiến Q1/2026) | phap-ly | |
| 12 | `ky-niem-20-nam-vsdc` | `vsdc-20-years` | Hướng tới kỷ niệm 20 năm VSDC — nền tảng triển khai CCP cơ sở | tin-ccp | Link vsd.vn |

**Post content structure (mỗi bài):**
- 1× `h2` lead
- 2–4× `paragraph`
- 1× `banner` block (style `info` hoặc `warning` cho dự thảo/pháp lý)
- Tuỳ chọn `relatedPosts` — link 2 bài cùng category (set trong index.ts sau create)

**Demo author:** reuse pattern seed cũ — `ccp-admin@vsd.vn` / password `password` (hoặc không tạo user mới nếu đã có admin).

---

## 9. Form liên hệ thành viên

File: `src/endpoints/seed-ccp/form-member-contact.ts`

| Field | blockType | label (VI) | required |
|-------|-----------|------------|----------|
| `company-name` | text | Tên tổ chức | yes |
| `contact-name` | text | Người liên hệ | yes |
| `email` | email | Email | yes |
| `phone` | text | Số điện thoại | yes |
| `member-type` | select | Loại thành viên | yes — options: CTCK, Ngân hàng, Tổ chức khác |
| `subject` | select | Nội dung | yes — options: Gia nhập CCP, Hỗ trợ kỹ thuật, Đào tạo, Khác |
| `message` | textarea | Nội dung chi tiết | yes |

- `title`: `Form liên hệ thành viên CCP`
- `submitButtonLabel`: `Gửi yêu cầu`
- `confirmationType`: `message`
- `confirmationMessage`: H2 *Cảm ơn Quý tổ chức đã liên hệ. Bộ phận CCP sẽ phản hồi trong vòng 2 ngày làm việc.*

---

## 10. Header & Footer globals

### 10.1 Header (max 6 items)

| # | label | target |
|---|-------|--------|
| 1 | Trang chủ | reference → `home` |
| 2 | Giới thiệu | reference → `gioi-thieu` |
| 3 | Mô hình CCP | reference → `mo-hinh-ccp` |
| 4 | Quản trị rủi ro | reference → `quan-tri-rui-ro` |
| 5 | Thành viên | reference → `thanh-vien` |
| 6 | Tin tức | custom → `/posts` |

**Không đặt trong header (link từ footer / in-page):** Quy chế, Công bố PFMI, Lộ trình, Đào tạo, Hệ thống, Liên hệ, VSDC.vn

### 10.2 Footer (max 6 items)

| # | label | target | newTab |
|---|-------|--------|--------|
| 1 | Quy chế | reference → `quy-che` | false |
| 2 | Công bố thông tin | reference → `cong-bo-thong-tin` | false |
| 3 | Lộ trình | reference → `lo-trinh` | false |
| 4 | Liên hệ | reference → `lien-he` | false |
| 5 | VSDC.vn | https://vsd.vn | true |
| 6 | Cổng quản trị | /admin | false |

---

## 11. Orchestrator — `seedCcp()` flow

File: `src/endpoints/seed-ccp/index.ts`

```typescript
export const seedCcp = async ({ payload, req }: { payload: Payload; req: PayloadRequest }) => {
  // 1. Log start
  // 2. Clear globals (header/footer navItems = [])
  // 3. deleteMany collections (same list as seed demo)
  // 4. deleteVersions where applicable
  // 5. Optional: delete demo users by email
  // 6. Fetch/create media (parallel)
  // 7. Create categories (parallel)
  // 8. Create demo author (optional)
  // 9. Create form
  // 10. Create pages IN ORDER (store ids in Map slug → id)
  //     - home first
  //     - others; lien-he needs form id
  // 11. Update pages with locale 'en'
  // 12. Create posts sequentially (for publishedAt order) OR parallel + fix dates
  // 13. Update posts locale 'en'
  // 14. Set relatedPosts on posts
  // 15. updateGlobal header & footer with page references
  // 16. Log success
}
```

**Context flag:** Mọi create/update page/post dùng `context: { disableRevalidate: true }` khi seed (giống seed cũ).

**Hero/page internal links:** Pass `pageIds: Record<string, number | string>` vào factory functions; resolve reference links sau khi all pages created — hoặc two-pass update.

---

## 12. Route & UI

### 12.1 Route

`src/app/(frontend)/next/seed-ccp/route.ts` — copy từ `seed/route.ts`, import `seedCcp` từ `@/endpoints/seed-ccp`.

### 12.2 Seed button (optional)

Extend `SeedButton` hoặc tạo `SeedCcpButton` gọi `POST /next/seed-ccp`.

Label: **Seed CCP website**

Toast success: *Database đã seed nội dung CCP. Truy cập trang chủ để xem.*

---

## 13. Checklist implement cho Cursor

```
[ ] Tạo helpers/lexical.ts + ids.ts
[ ] Tạo tất cả page factories trong pages/
[ ] Tạo 12 post factories trong posts/
[ ] Tạo categories.ts, form-member-contact.ts, globals/
[ ] Tạo index.ts orchestrator
[ ] Tạo route POST /next/seed-ccp
[ ] (Optional) SeedCcpButton trong admin
[ ] Chạy seed local — verify:
    [ ] / hiển thị trang chủ CCP (vi)
    [ ] /en hoặc locale switch → titles EN
    [ ] /posts có 12 bài, filter category
    [ ] /gioi-thieu, /mo-hinh-ccp, ... render blocks
    [ ] /lien-he form submit
    [ ] Header 6 links + Footer 6 links
    [ ] Không còn nội dung demo "VSC Website Template"
[ ] TypeScript compile không lỗi
```

---

## 14. Copy tiếng Anh — tóm tắt page titles

| slug (vi) | title EN | meta description EN (≤160 chars) |
|-----------|----------|----------------------------------|
| home | Home | Vietnam Securities Clearing Corporation — Central Counterparty for the cash equity market. A VSDC subsidiary. |
| gioi-thieu | About | About Vietnam Securities Clearing Corporation — CCP subsidiary of VSDC. |
| mo-hinh-ccp | CCP Model | How central counterparty clearing works: novation, multilateral netting, settlement. |
| quan-tri-rui-ro | Risk Management | CCP risk management framework: margin, default waterfall, PFMI disclosure. |
| thanh-vien | Clearing Members | Clearing membership criteria and onboarding process. |
| quy-che | Rules & Regulations | Operating rules, bylaws and regulatory references. |
| cong-bo-thong-tin | Disclosure | PFMI disclosure and periodic reports. |
| lo-trinh | Roadmap | CCP implementation roadmap — target go-live Q1 2027. |
| dao-tao | Training & Testing | Member training and UAT schedule. |
| he-thong | Systems | Technical connectivity and documentation. |
| lien-he | Contact | Contact CCP member support. |

---

## 15. Lưu ý pháp lý & nội dung

1. **Placeholder:** Số liệu thành viên, địa chỉ, hotline — dùng text placeholder, comment `// TODO: cập nhật từ VSDC`.
2. **Disclaimer:** Mọi trang quy chế/rủi ro cần câu: *Thông tin mang tính tham khảo; văn bản chính thức do cơ quan có thẩm quyền ban hành.*
3. **Không cam kết lợi nhuận** — CCP không phải broker; không dùng ngôn ngữ marketing đầu tư.
4. **Quan hệ VSDC:** Luôn ghi rõ “công ty con” — tránh nhầm là thay thế vsd.vn.
5. **Phái sinh vs cơ sở:** Tin SSI GCN — ghi chú rõ đang áp dụng cho phái sinh tại VSDC; CCP cơ sở là lộ trình riêng.

---

## 16. Tham chiếu code hiện có

| File | Học gì |
|------|--------|
| `src/endpoints/seed/index.ts` | Flow xóa DB, fetch media, locale update |
| `src/endpoints/seed/home.ts` | Cấu trúc Lexical + layout blocks |
| `src/endpoints/seed/post-1.ts` | Post content + banner block |
| `src/endpoints/seed/contact-form.ts` | Form fields schema |
| `src/app/(frontend)/next/seed/route.ts` | Auth + createLocalReq |

---

*Tài liệu spec v1.0 — sinh seed CCP cho Payload CMS website-deploy. Cập nhật khi có tên/địa chỉ/logo chính thức từ VSDC.*
