import {
  bulletList,
  h1,
  h2,
  h3,
  italicParagraph,
  lexicalRoot,
  orderedList,
  paragraph,
  text,
} from '../helpers/lexical'
import { asPageData } from '../helpers/cast'
import type { PageSeedArgs } from '../helpers/types'
import {
  contentBlock,
  contentColumn,
  ctaBlock,
  mediaBlock,
} from '../helpers/blocks'

const PUBLISHED_AT = '2026-01-15T08:00:00.000Z'

export const gioiThieuVi = (args: PageSeedArgs) => asPageData({
  title: 'Giới thiệu',
  slug: 'gioi-thieu',
  _status: 'published',
  publishedAt: PUBLISHED_AT,
  hero: {
    type: 'mediumImpact',
    media: args.media.heroAbout.id,
    richText: lexicalRoot([h1('Công ty Bù trừ Chứng khoán Việt Nam')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('CCP là gì?'),
          paragraph(
            'Đối tác Bù trừ Trung tâm (CCP) thực hiện novation — thay thế vai trò đối tác trong giao dịch, đảm bảo thanh toán ngay cả khi thành viên vi phạm nghĩa vụ.',
          ),
          h2('Vị trí trong hệ thống'),
          paragraph(
            'Sở GDTT → Khớp lệnh → VSDC (lưu ký) → CCP (bù trừ) → Thanh toán (T+)',
          ),
          paragraph(text('Công ty được thành lập là công ty con 100% vốn của VSDC, chuyên thực hiện chức năng CCP cho thị trường cơ sở.', 1)),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'half',
        lexicalRoot([
          h3('Tầm nhìn'),
          paragraph(
            'Trở thành CCP đạt chuẩn quốc tế, góp phần nâng hạng thị trường chứng khoán Việt Nam.',
          ),
        ]),
      ),
      contentColumn(
        'half',
        lexicalRoot([
          h3('Sứ mệnh'),
          paragraph(
            'Giảm rủi ro thanh toán, tăng minh bạch và niềm tin của nhà đầu tư trong nước và quốc tế.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Ban lãnh đạo'),
          paragraph(
            'Thông tin Ban Giám đốc và Hội đồng thành viên sẽ được cập nhật sau khi công ty chính thức đi vào hoạt động (Q1/2026).',
          ),
        ]),
      ),
    ),
    ctaBlock(lexicalRoot([h3('Tìm hiểu thêm')]), [
      { type: 'reference', pageKey: 'mo-hinh-ccp', label: 'Mô hình CCP', pageIds: args.pageIds },
      {
        type: 'reference',
        pageKey: 'quan-tri-rui-ro',
        label: 'Quản trị rủi ro',
        pageIds: args.pageIds,
      },
    ]),
  ],
  meta: {
    title: 'Giới thiệu — Công ty Bù trừ Chứng khoán Việt Nam',
    description:
      'Giới thiệu Công ty Bù trừ Chứng khoán Việt Nam — công ty con VSDC, vai trò CCP thị trường cơ sở.',
    image: args.media.metaDefault.id,
  },
})

export const gioiThieuEn = (args: PageSeedArgs) => asPageData({
  title: 'About',
  slug: 'about',
  _status: 'published',
  hero: {
    type: 'mediumImpact',
    media: args.media.heroAbout.id,
    richText: lexicalRoot([h1('Vietnam Securities Clearing Corporation')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('What is a CCP?'),
          paragraph(
            'A Central Counterparty performs novation — replacing counterparties in trades and ensuring settlement even if a member defaults.',
          ),
          h2('Position in the Market Infrastructure'),
          paragraph(
            'Exchange → Matching → VSDC (depository) → CCP (clearing) → Settlement (T+)',
          ),
          paragraph(
            text('The company is a 100% VSDC-owned subsidiary dedicated to CCP functions for the cash market.', 1),
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'half',
        lexicalRoot([
          h3('Vision'),
          paragraph(
            'To become an internationally compliant CCP contributing to Vietnam\'s market upgrade.',
          ),
        ]),
      ),
      contentColumn(
        'half',
        lexicalRoot([
          h3('Mission'),
          paragraph(
            'Reduce settlement risk and enhance transparency and investor confidence domestically and internationally.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Leadership'),
          paragraph(
            'Board and management information will be updated upon official commencement of operations (Q1/2026).',
          ),
        ]),
      ),
    ),
    ctaBlock(lexicalRoot([h3('Learn More')]), [
      { type: 'reference', pageKey: 'mo-hinh-ccp', label: 'CCP Model', pageIds: args.pageIds },
      {
        type: 'reference',
        pageKey: 'quan-tri-rui-ro',
        label: 'Risk Management',
        pageIds: args.pageIds,
      },
    ]),
  ],
  meta: {
    title: 'About — Vietnam Securities Clearing Corporation',
    description:
      'About Vietnam Securities Clearing Corporation — CCP subsidiary of VSDC.',
    image: args.media.metaDefault.id,
  },
})

export const moHinhCcpVi = (args: PageSeedArgs) => asPageData({
  title: 'Mô hình CCP',
  slug: 'mo-hinh-ccp',
  _status: 'published',
  publishedAt: PUBLISHED_AT,
  hero: {
    type: 'mediumImpact',
    media: args.media.heroModel.id,
    richText: lexicalRoot([h1('Mô hình Đối tác Bù trừ Trung tâm')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Novation (Thay thế hợp đồng)'),
          paragraph(
            'Sau khi giao dịch khớp lệnh tại Sở, CCP trở thành bên mua đối với người bán và bên bán đối với người mua.',
          ),
          bulletList([
            'Giảm rủi ro đối tác',
            'Tăng hiệu quả thanh toán',
            'Chuẩn hoá quy trình',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Bù trừ đa phương (Multilateral Netting)'),
          paragraph(
            'Tổng hợp vị thế mua/bán của thành viên, chỉ thanh toán phần ròng (net).',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'half',
        lexicalRoot([
          h3('Trước CCP'),
          paragraph('Rủi ro đối ứng từng cặp giao dịch bilaterally'),
        ]),
      ),
      contentColumn(
        'half',
        lexicalRoot([
          h3('Sau CCP'),
          paragraph('Rủi ro tập trung tại CCP, quản lý bằng margin & quỹ'),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Phạm vi áp dụng (dự kiến)'),
          bulletList([
            'Cổ phiếu niêm yết HOSE/HNX/UPCoM',
            'Chứng quyền',
            'Trái phiếu niêm yết (theo quy định SSC)',
          ]),
        ]),
      ),
    ),
    mediaBlock(args.media.heroModel.id),
    ctaBlock(lexicalRoot([h3('Tiếp theo')]), [
      {
        type: 'reference',
        pageKey: 'quan-tri-rui-ro',
        label: 'Quản trị rủi ro',
        pageIds: args.pageIds,
      },
    ]),
  ],
  meta: {
    title: 'Mô hình CCP — Công ty Bù trừ Chứng khoán Việt Nam',
    description:
      'Mô hình Đối tác Bù trừ Trung tâm: novation, bù trừ đa phương, thanh toán.',
    image: args.media.metaDefault.id,
  },
})

export const moHinhCcpEn = (args: PageSeedArgs) => asPageData({
  title: 'CCP Model',
  slug: 'ccp-model',
  _status: 'published',
  hero: {
    type: 'mediumImpact',
    media: args.media.heroModel.id,
    richText: lexicalRoot([h1('Central Counterparty Clearing Model')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Novation'),
          paragraph(
            'After trade matching at the exchange, the CCP becomes buyer to every seller and seller to every buyer.',
          ),
          bulletList([
            'Reduced counterparty risk',
            'Improved settlement efficiency',
            'Standardized processes',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Multilateral Netting'),
          paragraph(
            'Aggregates members\' buy/sell positions; only net amounts are settled.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'half',
        lexicalRoot([
          h3('Before CCP'),
          paragraph('Bilateral counterparty risk for each trade pair'),
        ]),
      ),
      contentColumn(
        'half',
        lexicalRoot([
          h3('After CCP'),
          paragraph('Risk centralized at CCP, managed via margin and default funds'),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Expected Scope'),
          bulletList([
            'Listed equities on HOSE/HNX/UPCoM',
            'Warrants',
            'Listed bonds (per SSC regulations)',
          ]),
        ]),
      ),
    ),
    mediaBlock(args.media.heroModel.id),
    ctaBlock(lexicalRoot([h3('Next')]), [
      {
        type: 'reference',
        pageKey: 'quan-tri-rui-ro',
        label: 'Risk Management',
        pageIds: args.pageIds,
      },
    ]),
  ],
  meta: {
    title: 'CCP Model — Vietnam Securities Clearing Corporation',
    description:
      'How central counterparty clearing works: novation, multilateral netting, settlement.',
    image: args.media.metaDefault.id,
  },
})

export const quanTriRuiRoVi = (args: PageSeedArgs) => asPageData({
  title: 'Quản trị rủi ro',
  slug: 'quan-tri-rui-ro',
  _status: 'published',
  publishedAt: PUBLISHED_AT,
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Khung quản trị rủi ro CCP')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Margin'),
          paragraph(
            'Initial Margin (IM) và Variation Margin (VM) — thu/collected hàng ngày theo vị thế ròng.',
          ),
          h2('Haircut & Stress test'),
          paragraph(
            'Áp dụng tỷ lệ haircut theo loại tài sản; stress test định kỳ theo kịch bản SSC.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Trình tự xử lý vi phạm (Default Waterfall)'),
          orderedList([
            'Tài sản ký quỹ của thành viên vi phạm',
            'Quỹ đóng góp của thành viên vi phạm (default fund contribution)',
            'Quỹ bù trừ chung (mutualized default fund)',
            'Vốn CCP và công cụ tài chính khác theo quy chế',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Giám sát vị thế tập trung'),
          paragraph('Theo dõi concentration risk theo mã chứng khoán và thành viên.'),
          paragraph(
            text('Thông tin mang tính tham khảo; văn bản chính thức do cơ quan có thẩm quyền ban hành.', 1),
          ),
        ]),
      ),
    ),
    ctaBlock(lexicalRoot([h3('Công bố thông tin')]), [
      {
        type: 'reference',
        pageKey: 'cong-bo-thong-tin',
        label: 'Xem công bố PFMI',
        pageIds: args.pageIds,
      },
    ]),
  ],
  meta: {
    title: 'Quản trị rủi ro — CCP VN',
    description: 'Khung quản trị rủi ro CCP: margin, default waterfall, giám sát vị thế.',
    image: args.media.metaDefault.id,
  },
})

export const quanTriRuiRoEn = (args: PageSeedArgs) => asPageData({
  title: 'Risk Management',
  slug: 'risk-management',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('CCP Risk Management Framework')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Margin'),
          paragraph(
            'Initial Margin (IM) and Variation Margin (VM) — collected daily based on net positions.',
          ),
          h2('Haircut & Stress Testing'),
          paragraph(
            'Asset-type haircuts applied; periodic stress tests per SSC scenarios.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Default Waterfall'),
          orderedList([
            'Defaulting member\'s collateral',
            'Defaulting member\'s default fund contribution',
            'Mutualized default fund',
            'CCP capital and other financial resources per rules',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Concentration Monitoring'),
          paragraph('Monitoring concentration risk by security and member.'),
          paragraph(
            text('Information is for reference only; official documents are issued by competent authorities.', 1),
          ),
        ]),
      ),
    ),
    ctaBlock(lexicalRoot([h3('Disclosure')]), [
      {
        type: 'reference',
        pageKey: 'cong-bo-thong-tin',
        label: 'View PFMI Disclosure',
        pageIds: args.pageIds,
      },
    ]),
  ],
  meta: {
    title: 'Risk Management — Vietnam Securities Clearing Corporation',
    description:
      'CCP risk management framework: margin, default waterfall, PFMI disclosure.',
    image: args.media.metaDefault.id,
  },
})

export const thanhVienVi = (args: PageSeedArgs) => asPageData({
  title: 'Thành viên bù trừ',
  slug: 'thanh-vien',
  _status: 'published',
  publishedAt: PUBLISHED_AT,
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Thành viên bù trừ')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Tiêu chí tham gia (tóm tắt)'),
          bulletList([
            'CTCK / Ngân hàng đủ điều kiện theo quy định SSC',
            'Đủ năng lực tài chính',
            'Hạ tầng IT kết nối VSDC/CCP',
            'Nhân sự nghiệp vụ bù trừ được đào tạo',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Danh sách thành viên'),
          paragraph(
            'Danh sách thành viên bù trừ sẽ được công bố khi bắt đầu cấp Giấy chứng nhận (từ Q1/2027).',
          ),
          italicParagraph(
            'VSDC đã cấp GCN thành viên bù trừ phái sinh — tham khảo tin tại vsd.vn.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Quy trình gia nhập'),
          orderedList([
            'Nộp hồ sơ',
            'Thẩm định',
            'Ký thỏa thuận',
            'Kết nối hệ thống',
            'UAT',
            'Cấp GCN',
          ]),
        ]),
      ),
    ),
    ctaBlock(lexicalRoot([h3('Liên hệ')]), [
      {
        type: 'reference',
        pageKey: 'lien-he',
        label: 'Liên hệ bộ phận thành viên',
        pageIds: args.pageIds,
      },
    ]),
  ],
  meta: {
    title: 'Thành viên bù trừ — CCP VN',
    description: 'Tiêu chí và quy trình gia nhập thành viên bù trừ CCP thị trường cơ sở.',
    image: args.media.metaDefault.id,
  },
})

export const thanhVienEn = (args: PageSeedArgs) => asPageData({
  title: 'Clearing Members',
  slug: 'clearing-members',
  _status: 'published',
  hero: {
    type: 'lowImpact',
    richText: lexicalRoot([h1('Clearing Members')]),
  },
  layout: [
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Membership Criteria (Summary)'),
          bulletList([
            'Qualified securities firms / banks per SSC regulations',
            'Adequate financial capacity',
            'IT infrastructure connected to VSDC/CCP',
            'Trained clearing operations staff',
          ]),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Member List'),
          paragraph(
            'The clearing member list will be published when certification begins (from Q1/2027).',
          ),
          italicParagraph(
            'VSDC has certified derivatives clearing members — see vsd.vn for reference.',
          ),
        ]),
      ),
    ),
    contentBlock(
      contentColumn(
        'full',
        lexicalRoot([
          h2('Onboarding Process'),
          orderedList([
            'Submit application',
            'Due diligence',
            'Sign agreement',
            'System connectivity',
            'UAT',
            'Certificate issuance',
          ]),
        ]),
      ),
    ),
    ctaBlock(lexicalRoot([h3('Contact')]), [
      {
        type: 'reference',
        pageKey: 'lien-he',
        label: 'Contact member services',
        pageIds: args.pageIds,
      },
    ]),
  ],
  meta: {
    title: 'Clearing Members — Vietnam Securities Clearing Corporation',
    description: 'Clearing membership criteria and onboarding process.',
    image: args.media.metaDefault.id,
  },
})
