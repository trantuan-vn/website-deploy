import {
  bulletList,
  h1,
  h2,
  h3,
  lexicalRoot,
  link,
  orderedList,
  paragraph,
  text,
} from '../helpers/lexical'
import { asPageData } from '../helpers/cast'
import type { PageSeedArgs } from '../helpers/types'
import {
  archiveBlock,
  contentBlock,
  contentColumn,
  ctaBlock,
  formBlock,
} from '../helpers/blocks'

const PUBLISHED_AT = '2026-01-15T08:00:00.000Z'

export const quyCheVi = (args: PageSeedArgs) => asPageData({
  title: 'Quy chế & Văn bản',
  slug: 'quy-che',
  _status: 'published',
  publishedAt: PUBLISHED_AT,
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Quy chế & Văn bản pháp lý')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Văn bản nội bộ CCP'),
          bulletList([
            'Điều lệ Công ty Bù trừ Chứng khoán Việt Nam (dự thảo)',
            'Quy chế hoạt động CCP',
            'Quy chế tài chính và quản lý quỹ bù trừ',
            'Quy chế quản lý rủi ro',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Văn bản pháp luật liên quan'),
          bulletList([
            'Luật Chứng khoán (sửa đổi)',
            'Thông tư 119/2020/TT-BTC (thay thế dự kiến 2026)',
            'Thông tư 89/2019/TT-BTC (kế toán VSDC/CCP)',
            'Quyết định thành lập VSDC',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          paragraph(
            text('Văn bản chính thức có giá trị pháp lý khi được cơ quan có thẩm quyền ban hành. Website chỉ mang tính thông tin.', 1),
          ),
        ]),
      ),
    ),
  ],
  meta: {
    title: 'Quy chế & Văn bản — CCP VN',
    description: 'Quy chế hoạt động, điều lệ và văn bản pháp luật liên quan CCP.',
    image: args.media.metaDefault.id,
  },
})

export const quyCheEn = (args: PageSeedArgs) => asPageData({
  title: 'Rules & Regulations',
  slug: 'rules',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Rules & Legal Documents')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Internal CCP Documents'),
          bulletList([
            'Bylaws of Vietnam Securities Clearing Corporation (draft)',
            'CCP Operating Rules',
            'Financial Rules and Default Fund Management',
            'Risk Management Rules',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Related Legal Framework'),
          bulletList([
            'Securities Law (amended)',
            'Circular 119/2020/TT-BTC (replacement expected 2026)',
            'Circular 89/2019/TT-BTC (VSDC/CCP accounting)',
            'VSDC establishment decision',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          paragraph(
            text('Official documents are legally binding when issued by competent authorities. This website is for information only.', 1),
          ),
        ]),
      ),
    ),
  ],
  meta: {
    title: 'Rules & Regulations — Vietnam Securities Clearing Corporation',
    description: 'Operating rules, bylaws and regulatory references.',
    image: args.media.metaDefault.id,
  },
})

export const congBoThongTinVi = (args: PageSeedArgs) => asPageData({
  title: 'Công bố thông tin',
  slug: 'cong-bo-thong-tin',
  _status: 'published',
  publishedAt: PUBLISHED_AT,
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Công bố thông tin & PFMI')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Khung PFMI (Principles for Financial Market Infrastructures)'),
          paragraph(
            'CCP cam kết công bố thông tin theo 15 nguyên tắc CPSS-IOSCO, tương tự khung VSDC đã áp dụng.',
          ),
          paragraph(link('PFMI Disclosure Framework (VSDC)', 'https://vsd.vn', true)),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Báo cáo định kỳ'),
          bulletList([
            'Báo cáo tình hình quản lý Quỹ bù trừ (quý/tháng)',
            'Báo cáo tài chính CCP',
            'Thông báo thay đổi quy chế hoạt động',
          ]),
        ]),
      ),
    ),
    archiveBlock({
      categoryKeys: ['quy-bu-tru', 'phap-ly'],
      categoryIds: args.categoryIds,
      limit: 5,
      introContent: lexicalRoot([h2('Báo cáo & Văn bản gần đây')]),
    }),
  ],
  meta: {
    title: 'Công bố thông tin — CCP VN',
    description: 'Công bố thông tin PFMI và báo cáo định kỳ của CCP.',
    image: args.media.metaDefault.id,
  },
})

export const congBoThongTinEn = (args: PageSeedArgs) => asPageData({
  title: 'Disclosure',
  slug: 'disclosure',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Disclosure & PFMI')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('PFMI Framework'),
          paragraph(
            'The CCP commits to disclosure aligned with the 15 CPSS-IOSCO principles, similar to VSDC\'s framework.',
          ),
          paragraph(link('PFMI Disclosure Framework (VSDC)', 'https://vsd.vn', true)),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Periodic Reports'),
          bulletList([
            'Default fund management reports (quarterly/monthly)',
            'CCP financial statements',
            'Operating rules change notices',
          ]),
        ]),
      ),
    ),
    archiveBlock({
      categoryKeys: ['quy-bu-tru', 'phap-ly'],
      categoryIds: args.categoryIds,
      limit: 5,
      introContent: lexicalRoot([h2('Recent Reports & Documents')]),
    }),
  ],
  meta: {
    title: 'Disclosure — Vietnam Securities Clearing Corporation',
    description: 'PFMI disclosure and periodic reports.',
    image: args.media.metaDefault.id,
  },
})

export const loTrinhVi = (args: PageSeedArgs) => asPageData({
  title: 'Lộ trình triển khai',
  slug: 'lo-trinh',
  _status: 'published',
  publishedAt: PUBLISHED_AT,
  hero: {
    type: 'mediumImpact',
    media: args.media.heroRoadmap.id,
    richText: lexicalRoot([h1('Lộ trình triển khai CCP')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Các mốc chính'),
          orderedList([
            'Q3–Q4/2025: Trình phê duyệt Đề án & bổ sung vốn VSDC',
            'Q1/2026: Thành lập công ty con, ban hành Điều lệ',
            'Q1–Q2/2026: SSC + VSDC ban hành Thông tư thay 119/2020',
            '2026: Đào tạo, kiểm thử, nâng cấp hạ tầng IT',
            'Q1/2027: Go-live CCP thị trường cơ sở',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Liên quan nâng hạng thị trường'),
          paragraph(
            'Triển khai CCP là điều kiện quan trọng nâng hạng thị trường chứng khoán Việt Nam từ cận cấp 2 lên mới nổi (theo kế hoạch SSC).',
          ),
        ]),
      ),
    ),
    ctaBlock(lexicalRoot([h3('Tiếp theo')]), [
      { type: 'reference', pageKey: 'dao-tao', label: 'Đào tạo & Kiểm thử', pageIds: args.pageIds },
      { type: 'reference', pageKey: 'he-thong', label: 'Hệ thống & Kết nối', pageIds: args.pageIds },
    ]),
  ],
  meta: {
    title: 'Lộ trình triển khai — CCP VN',
    description: 'Lộ trình triển khai CCP thị trường cơ sở — mục tiêu go-live Q1/2027.',
    image: args.media.metaDefault.id,
  },
})

export const loTrinhEn = (args: PageSeedArgs) => asPageData({
  title: 'Roadmap',
  slug: 'roadmap',
  _status: 'published',
  hero: {
    type: 'mediumImpact',
    media: args.media.heroRoadmap.id,
    richText: lexicalRoot([h1('CCP Implementation Roadmap')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Key Milestones'),
          orderedList([
            'Q3–Q4/2025: Submit establishment plan & VSDC capital increase',
            'Q1/2026: Subsidiary incorporation, bylaws issuance',
            'Q1–Q2/2026: SSC + VSDC issue replacement for Circular 119/2020',
            '2026: Training, testing, IT infrastructure upgrade',
            'Q1/2027: Cash market CCP go-live',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Market Upgrade Relevance'),
          paragraph(
            'CCP implementation is a key condition for upgrading Vietnam\'s market from frontier to emerging status (per SSC plan).',
          ),
        ]),
      ),
    ),
    ctaBlock(lexicalRoot([h3('Next Steps')]), [
      { type: 'reference', pageKey: 'dao-tao', label: 'Training & Testing', pageIds: args.pageIds },
      { type: 'reference', pageKey: 'he-thong', label: 'Systems & Connectivity', pageIds: args.pageIds },
    ]),
  ],
  meta: {
    title: 'Roadmap — Vietnam Securities Clearing Corporation',
    description: 'CCP implementation roadmap — target go-live Q1 2027.',
    image: args.media.metaDefault.id,
  },
})

export const daoTaoVi = (args: PageSeedArgs) => asPageData({
  title: 'Đào tạo & Kiểm thử',
  slug: 'dao-tao',
  _status: 'published',
  publishedAt: PUBLISHED_AT,
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Đào tạo & Kiểm thử hệ thống')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Chương trình tập huấn 2026'),
          bulletList([
            'Nghiệp vụ CCP & novation',
            'Quy trình margin call',
            'Kết nối hệ thống & message spec',
            'Diễn tập xử lý vi phạm',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Kiểm thử (UAT)'),
          paragraph(
            'Kiểm thử song phương với thành viên dự kiến — đăng ký qua bộ phận liên hệ.',
          ),
        ]),
      ),
    ),
    archiveBlock({
      categoryKeys: ['dao-tao-kiem-thu'],
      categoryIds: args.categoryIds,
      limit: 5,
      introContent: lexicalRoot([h2('Tin đào tạo & kiểm thử')]),
    }),
  ],
  meta: {
    title: 'Đào tạo & Kiểm thử — CCP VN',
    description: 'Chương trình tập huấn và lịch UAT cho thành viên bù trừ.',
    image: args.media.metaDefault.id,
  },
})

export const daoTaoEn = (args: PageSeedArgs) => asPageData({
  title: 'Training & Testing',
  slug: 'training',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Training & System Testing')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('2026 Training Program'),
          bulletList([
            'CCP operations & novation',
            'Margin call procedures',
            'System connectivity & message specs',
            'Default management drills',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('UAT'),
          paragraph(
            'Bilateral testing with prospective members — register via contact department.',
          ),
        ]),
      ),
    ),
    archiveBlock({
      categoryKeys: ['dao-tao-kiem-thu'],
      categoryIds: args.categoryIds,
      limit: 5,
      introContent: lexicalRoot([h2('Training & Testing News')]),
    }),
  ],
  meta: {
    title: 'Training & Testing — Vietnam Securities Clearing Corporation',
    description: 'Member training and UAT schedule.',
    image: args.media.metaDefault.id,
  },
})

export const heThongVi = (args: PageSeedArgs) => asPageData({
  title: 'Hệ thống & Kết nối',
  slug: 'he-thong',
  _status: 'published',
  publishedAt: PUBLISHED_AT,
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Hệ thống kỹ thuật')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Kiến trúc kết nối'),
          paragraph(
            'Thành viên bù trừ ↔ Hệ thống CCP ↔ VSDC (lưu ký & thanh toán) ↔ Sở GDTT',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Tài liệu kỹ thuật'),
          paragraph(
            'Tài liệu đặc tả kỹ thuật (API, file layout) dành cho thành viên — liên hệ bộ phận hỗ trợ.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'half',
        lexicalRoot([
          h3('SLA & cửa sổ bảo trì'),
          paragraph('Thông tin SLA và lịch bảo trì sẽ được cập nhật trước go-live.'), // TODO: cập nhật từ VSDC
        ]),
      ),
      contentColumn(
        'half',
        lexicalRoot([
          h3('Hotline kỹ thuật'),
          paragraph('(024) xxxx xxxx — placeholder'), // TODO: cập nhật từ VSDC
        ]),
      ),
    ),
  ],
  meta: {
    title: 'Hệ thống & Kết nối — CCP VN',
    description: 'Kiến trúc kết nối kỹ thuật và tài liệu dành cho thành viên.',
    image: args.media.metaDefault.id,
  },
})

export const heThongEn = (args: PageSeedArgs) => asPageData({
  title: 'Systems',
  slug: 'systems',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Technical Systems')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Connectivity Architecture'),
          paragraph(
            'Clearing members ↔ CCP System ↔ VSDC (depository & settlement) ↔ Exchange',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Technical Documentation'),
          paragraph(
            'Technical specifications (API, file layouts) for members — contact support department.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'half',
        lexicalRoot([
          h3('SLA & Maintenance Windows'),
          paragraph('SLA and maintenance schedule to be updated before go-live.'),
        ]),
      ),
      contentColumn(
        'half',
        lexicalRoot([
          h3('Technical Hotline'),
          paragraph('(024) xxxx xxxx — placeholder'),
        ]),
      ),
    ),
  ],
  meta: {
    title: 'Systems — Vietnam Securities Clearing Corporation',
    description: 'Technical connectivity and documentation.',
    image: args.media.metaDefault.id,
  },
})

export const lienHeVi = (args: PageSeedArgs) => {
  if (!args.form) throw new Error('Form required for lien-he page')
  return asPageData({
    title: 'Liên hệ',
    slug: 'lien-he',
    _status: 'published',
    publishedAt: PUBLISHED_AT,
    hero: { type: 'none' },
    layout: [
      formBlock(args.form.id, lexicalRoot([h3('Liên hệ bộ phận CCP / Hỗ trợ thành viên')])),
      contentBlock(
        contentColumn(
          'full',
          lexicalRoot([
            h2('Trụ sở'),
            paragraph(
              'Tòa nhà VSDC, [địa chỉ placeholder — cập nhật theo VSDC thực tế], Hà Nội',
            ),
            h2('Điện thoại'),
            paragraph('Hotline nghiệp vụ: (024) xxxx xxxx | Hotline kỹ thuật: (024) xxxx xxxx'),
            paragraph(link('VSDC.vn', 'https://vsd.vn', true)),
          ]),
        ),
      ),
    ],
    meta: {
      title: 'Liên hệ — CCP VN',
      description: 'Liên hệ bộ phận CCP và hỗ trợ thành viên bù trừ.',
      image: args.media.metaDefault.id,
    },
  })
}

export const lienHeEn = (args: PageSeedArgs) => {
  if (!args.form) throw new Error('Form required for lien-he page')
  return asPageData({
    title: 'Contact',
    slug: 'contact',
    _status: 'published',
    hero: { type: 'none' },
    layout: [
      formBlock(args.form.id, lexicalRoot([h3('Contact CCP / Member Support')])),
      contentBlock(
        contentColumn(
          'full',
          lexicalRoot([
            h2('Head Office'),
            paragraph('VSDC Building, [address placeholder], Hanoi'),
            h2('Phone'),
            paragraph('Operations hotline: (024) xxxx xxxx | Technical hotline: (024) xxxx xxxx'),
            paragraph(link('VSDC.vn', 'https://vsd.vn', true)),
          ]),
        ),
      ),
    ],
    meta: {
      title: 'Contact — Vietnam Securities Clearing Corporation',
      description: 'Contact CCP member support.',
      image: args.media.metaDefault.id,
    },
  })
}
