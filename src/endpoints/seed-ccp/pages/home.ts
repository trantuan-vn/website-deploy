import {
  bulletList,
  h1,
  h2,
  h3,
  lexicalRoot,
  orderedList,
  paragraph,
} from '../helpers/lexical'
import type { PageSeedArgs } from '../helpers/types'
import {
  archiveBlock,
  contentBlock,
  contentColumn,
  ctaBlock,
  heroLinkReference,
} from '../helpers/blocks'
import { asPageData } from '../helpers/cast'

const PUBLISHED_AT = '2026-01-15T08:00:00.000Z'

const homeHeroVi = (args: PageSeedArgs, media: keyof Pick<PageSeedArgs['media'], 'heroHome' | 'heroHome2' | 'heroHome3'>) => ({
  type: 'highImpact' as const,
  media: args.media[media].id,
  richText: lexicalRoot([
    h1('Đối tác Bù trừ Trung tâm cho thị trường chứng khoán cơ sở Việt Nam'),
    paragraph(
      'Công ty Bù trừ Chứng khoán Việt Nam — công ty con Tổng công ty Lưu ký và Bù trừ Chứng khoán Việt Nam (VSDC) — triển khai cơ chế CCP theo lộ trình chính thức vận hành quý I/2027.',
    ),
  ]),
})

export const homeVi = (args: PageSeedArgs) => asPageData({
  title: 'Trang chủ',
  slug: 'home',
  _status: 'published',
  publishedAt: PUBLISHED_AT,
  heroes: [
    homeHeroVi(args, 'heroHome'),
    homeHeroVi(args, 'heroHome2'),
    homeHeroVi(args, 'heroHome3'),
  ].map((hero) => ({
    ...hero,
    links: [
      heroLinkReference(
        'Tìm hiểu mô hình CCP',
        args.pageIds['mo-hinh-ccp'],
        'default',
      ),
    ],
  })),
  layout: [
    contentBlock(
      contentColumn(
        'oneThird',
        lexicalRoot([
          h3('An toàn hệ thống'),
          paragraph(
            'CCP đứng giữa giao dịch, thực hiện novation và bù trừ đa phương, giảm rủi ro đối tác không thanh toán.',
          ),
        ]),
      ),
      contentColumn(
        'oneThird',
        lexicalRoot([
          h3('Minh bạch PFMI'),
          paragraph(
            'Công bố thông tin theo khung PFMI (CPSS-IOSCO), báo cáo quỹ bù trừ định kỳ, quy trình xử lý vi phạm công khai.',
          ),
        ]),
      ),
      contentColumn(
        'oneThird',
        lexicalRoot([
          h3('Sẵn sàng thành viên'),
          paragraph(
            'Lộ trình tập huấn, kiểm thử hệ thống và cấp Giấy chứng nhận thành viên bù trừ từ 2026.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Số liệu nổi bật'),
          bulletList([
            'Thành viên bù trừ (dự kiến): đang tuyển hội đủ điều kiện',
            'Lộ trình vận hành: Quý I/2027',
            'Thuộc: VSDC — 100% vốn nhà nước',
            'Chuẩn mực: PFMI / IOSCO',
          ]),
        ]),
      ),
    ),
    archiveBlock({
      categoryKeys: ['tin-ccp', 'thong-bao-thanh-vien'],
      categoryIds: args.categoryIds,
      limit: 5,
      introContent: lexicalRoot([h2('Tin tức & Thông báo')]),
    }),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Lộ trình triển khai CCP'),
          orderedList([
            'Q4/2025 — Phê duyệt Đề án thành lập Công ty Bù trừ Chứng khoán Việt Nam',
            'Q1/2026 — Ban hành Điều lệ, quy chế tài chính và nghiệp vụ',
            '2026 — Tập huấn, kiểm thử song phương với thành viên thị trường',
            'Q1/2027 — Vận hành chính thức cơ chế CCP thị trường cơ sở',
          ]),
        ]),
        {
          type: 'reference',
          pageKey: 'lo-trinh',
          label: 'Xem chi tiết lộ trình',
          pageIds: args.pageIds,
        },
      ),
    ),
    ctaBlock(
      lexicalRoot([
        h3('Thuộc hệ sinh thái VSDC'),
        paragraph(
          'Dịch vụ lưu ký, đăng ký chứng khoán và bù trừ đa thị trường được cung cấp bởi Tổng công ty Lưu ký và Bù trừ Chứng khoán Việt Nam.',
        ),
      ]),
      [
        { type: 'custom', url: 'https://vsd.vn', label: 'VSDC.vn', newTab: true },
        {
          type: 'reference',
          pageKey: 'lien-he',
          label: 'Liên hệ CCP',
          pageIds: args.pageIds,
        },
      ],
    ),
  ],
  meta: {
    title: 'Công ty Bù trừ Chứng khoán Việt Nam — CCP thị trường cơ sở',
    description:
      'Công ty Bù trừ Chứng khoán Việt Nam (CCP VN) — công ty con VSDC, triển khai cơ chế Đối tác Bù trừ Trung tâm cho thị trường chứng khoán cơ sở, mục tiêu go-live Q1/2027.',
    image: args.media.metaDefault.id,
  },
})

const homeHeroEn = (args: PageSeedArgs, media: keyof Pick<PageSeedArgs['media'], 'heroHome' | 'heroHome2' | 'heroHome3'>) => ({
  type: 'highImpact' as const,
  media: args.media[media].id,
  richText: lexicalRoot([
    h1('Central Counterparty for Vietnam\'s Cash Equity Market'),
    paragraph(
      'Vietnam Securities Clearing Corporation — a wholly-owned subsidiary of Vietnam Securities Depository and Clearing Corporation (VSDC) — is implementing CCP clearing with official go-live targeted for Q1 2027.',
    ),
  ]),
})

export const homeEn = (args: PageSeedArgs) => asPageData({
  title: 'Home',
  slug: 'home',
  _status: 'published',
  heroes: [
    homeHeroEn(args, 'heroHome'),
    homeHeroEn(args, 'heroHome2'),
    homeHeroEn(args, 'heroHome3'),
  ].map((hero) => ({
    ...hero,
    links: [
      heroLinkReference('Explore CCP Model', args.pageIds['mo-hinh-ccp'], 'default'),
    ],
  })),
  layout: [
    contentBlock(
      contentColumn(
        'oneThird',
        lexicalRoot([
          h3('System Safety'),
          paragraph(
            'The CCP sits between trades, performs novation and multilateral netting, reducing counterparty default risk.',
          ),
        ]),
      ),
      contentColumn(
        'oneThird',
        lexicalRoot([
          h3('PFMI Transparency'),
          paragraph(
            'Disclosure aligned with PFMI (CPSS-IOSCO), periodic default fund reporting, and public default procedures.',
          ),
        ]),
      ),
      contentColumn(
        'oneThird',
        lexicalRoot([
          h3('Member Readiness'),
          paragraph(
            'Training, system testing, and clearing member certification from 2026.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Key Highlights'),
          bulletList([
            'Clearing members (expected): recruiting qualified institutions',
            'Go-live roadmap: Q1 2027',
            'Parent: VSDC — 100% state-owned',
            'Standards: PFMI / IOSCO',
          ]),
        ]),
      ),
    ),
    archiveBlock({
      categoryKeys: ['tin-ccp', 'thong-bao-thanh-vien'],
      categoryIds: args.categoryIds,
      limit: 5,
      introContent: lexicalRoot([h2('News & Announcements')]),
    }),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('CCP Implementation Roadmap'),
          orderedList([
            'Q4/2025 — Approval of establishment plan for Vietnam Securities Clearing Corporation',
            'Q1/2026 — Issuance of bylaws, financial and operational rules',
            '2026 — Training and bilateral testing with market members',
            'Q1/2027 — Official go-live of cash market CCP',
          ]),
        ]),
        {
          type: 'reference',
          pageKey: 'lo-trinh',
          label: 'View full roadmap',
          pageIds: args.pageIds,
        },
      ),
    ),
    ctaBlock(
      lexicalRoot([
        h3('Part of the VSDC Ecosystem'),
        paragraph(
          'Depository, registration, and multi-market clearing services are provided by Vietnam Securities Depository and Clearing Corporation.',
        ),
      ]),
      [
        { type: 'custom', url: 'https://vsd.vn', label: 'VSDC.vn', newTab: true },
        {
          type: 'reference',
          pageKey: 'lien-he',
          label: 'Contact CCP',
          pageIds: args.pageIds,
        },
      ],
    ),
  ],
  meta: {
    title: 'Vietnam Securities Clearing Corporation — Cash Market CCP',
    description:
      'Vietnam Securities Clearing Corporation — Central Counterparty for the cash equity market. A VSDC subsidiary.',
    image: args.media.metaDefault.id,
  },
})
