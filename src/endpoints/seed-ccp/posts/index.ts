import { generateBlockId } from '../helpers/ids'
import { lexicalRoot, paragraph } from '../helpers/lexical'
import { asPostData } from '../helpers/cast'
import type { PostSeedArgs } from '../helpers/types'

type BannerStyle = 'info' | 'warning'

function bannerBlock(content: string, style: BannerStyle = 'info') {
  return {
    type: 'block' as const,
    fields: {
      id: generateBlockId(),
      blockName: 'Disclaimer',
      blockType: 'banner' as const,
      style,
      content: lexicalRoot([paragraph(content)]),
    },
    format: '',
    version: 2,
  }
}

export type PostDef = {
  slugVi: string
  slugEn: string
  titleVi: string
  titleEn: string
  categoryKey: string
  publishedAt: string
  leadVi: string
  leadEn: string
  paragraphsVi: string[]
  paragraphsEn: string[]
  bannerVi: string
  bannerEn: string
  bannerStyle?: BannerStyle
}

export const POST_DEFINITIONS: PostDef[] = [
  {
    slugVi: 'vsdc-cong-bo-ke-hoach-ccp-2027',
    slugEn: 'vsdc-ccp-roadmap-2027',
    titleVi: 'VSDC công bố lộ trình triển khai CCP thị trường cơ sở vào Q1/2027',
    titleEn: 'VSDC announces cash market CCP roadmap targeting Q1/2027',
    categoryKey: 'tin-ccp',
    publishedAt: '2025-10-01T08:00:00.000Z',
    leadVi: 'Lộ trình chính thức hướng tới vận hành CCP thị trường cơ sở',
    leadEn: 'Official roadmap toward cash market CCP operations',
    paragraphsVi: [
      'Tổng công ty Lưu ký và Bù trừ Chứng khoán Việt Nam (VSDC) công bố kế hoạch triển khai cơ chế Đối tác Bù trừ Trung tâm (CCP) cho thị trường chứng khoán cơ sở, với mục tiêu go-live quý I/2027.',
      'Công ty Bù trừ Chứng khoán Việt Nam — công ty con 100% vốn VSDC — sẽ đảm nhiệm vai trò CCP, thực hiện novation và bù trừ đa phương.',
      'Lộ trình bao gồm hoàn thiện pháp lý, xây dựng hạ tầng IT, tập huấn thành viên và kiểm thử song phương trong năm 2026.',
    ],
    paragraphsEn: [
      'Vietnam Securities Depository and Clearing Corporation (VSDC) announced plans to implement Central Counterparty (CCP) clearing for the cash equity market, targeting Q1/2027 go-live.',
      'Vietnam Securities Clearing Corporation — a 100% VSDC-owned subsidiary — will serve as the CCP, performing novation and multilateral netting.',
      'The roadmap includes legal finalization, IT infrastructure, member training, and bilateral testing throughout 2026.',
    ],
    bannerVi: 'Thông tin mang tính tham khảo; văn bản chính thức do cơ quan có thẩm quyền ban hành.',
    bannerEn: 'Information is for reference only; official documents are issued by competent authorities.',
  },
  {
    slugVi: 'de-an-thanh-lap-cong-ty-bu-tru',
    slugEn: 'establishment-plan-clearing-co',
    titleVi: 'Trình phê duyệt Đề án thành lập Công ty Bù trừ Chứng khoán Việt Nam',
    titleEn: 'Establishment plan submitted for Vietnam Securities Clearing Corporation',
    categoryKey: 'tin-ccp',
    publishedAt: '2025-09-15T08:00:00.000Z',
    leadVi: 'Bước quan trọng trong lộ trình CCP thị trường cơ sở',
    leadEn: 'A key milestone in the cash market CCP roadmap',
    paragraphsVi: [
      'VSDC trình phê duyệt Đề án thành lập Công ty TNHH Một thành viên Bù trừ Chứng khoán Việt Nam.',
      'Công ty con sẽ chuyên trách chức năng CCP, tách biệt với hoạt động lưu ký và bù trừ phái sinh hiện tại của VSDC.',
    ],
    paragraphsEn: [
      'VSDC submitted the establishment plan for Vietnam Securities Clearing Corporation (single-member LLC).',
      'The subsidiary will be dedicated to CCP functions, separate from VSDC\'s current depository and derivatives clearing operations.',
    ],
    bannerVi: 'Thông tin mang tính tham khảo; văn bản chính thức do cơ quan có thẩm quyền ban hành.',
    bannerEn: 'Information is for reference only; official documents are issued by competent authorities.',
  },
  {
    slugVi: 'hoi-thao-mo-hinh-ccp-wb',
    slugEn: 'wb-ccp-workshop',
    titleVi: 'Hội thảo trao đổi mô hình CCP với chuyên gia Ngân hàng Thế giới',
    titleEn: 'CCP model workshop with World Bank experts',
    categoryKey: 'tin-ccp',
    publishedAt: '2025-08-20T08:00:00.000Z',
    leadVi: 'Học hỏi kinh nghiệm quốc tế về CCP',
    leadEn: 'Learning from international CCP experience',
    paragraphsVi: [
      'VSDC và các đối tác tổ chức hội thảo trao đổi mô hình CCP với chuyên gia Ngân hàng Thế giới và các CCP khu vực.',
      'Nội dung tập trung vào khung PFMI, quản trị rủi ro và lộ trình triển khai phù hợp thị trường mới nổi.',
    ],
    paragraphsEn: [
      'VSDC and partners hosted a workshop on CCP models with World Bank experts and regional CCPs.',
      'Topics included PFMI framework, risk management, and implementation roadmaps for emerging markets.',
    ],
    bannerVi: 'Thông tin mang tính tham khảo.',
    bannerEn: 'Information is for reference only.',
  },
  {
    slugVi: 'ssi-cap-gcn-thanh-vien-bu-tru-ps',
    slugEn: 'ssi-clearing-member-cert',
    titleVi: 'SSI: Cấp Giấy chứng nhận thành viên bù trừ (phái sinh) — tham chiếu',
    titleEn: 'SSI: Derivatives clearing member certificate — reference',
    categoryKey: 'thong-bao-thanh-vien',
    publishedAt: '2025-11-10T08:00:00.000Z',
    leadVi: 'Tham chiếu GCN thành viên bù trừ phái sinh tại VSDC',
    leadEn: 'Reference: derivatives clearing membership at VSDC',
    paragraphsVi: [
      'SSI được VSDC cấp Giấy chứng nhận thành viên bù trừ cho thị trường phái sinh — tiền đề kinh nghiệm cho CCP thị trường cơ sở.',
      'CCP thị trường cơ sở do Công ty Bù trừ Chứng khoán Việt Nam vận hành là lộ trình riêng, dự kiến go-live Q1/2027.',
    ],
    paragraphsEn: [
      'SSI received VSDC clearing member certification for the derivatives market — experience relevant to the upcoming cash market CCP.',
      'The cash market CCP operated by Vietnam Securities Clearing Corporation is a separate roadmap, expected go-live Q1/2027.',
    ],
    bannerVi: 'Ghi chú: GCN này áp dụng cho phái sinh tại VSDC, không phải CCP cơ sở.',
    bannerEn: 'Note: This certificate applies to VSDC derivatives clearing, not the cash market CCP.',
  },
  {
    slugVi: 'tap-huan-nghiep-vu-ccp-2026',
    slugEn: 'ccp-training-2026',
    titleVi: 'Kế hoạch tập huấn nghiệp vụ CCP cho thành viên thị trường năm 2026',
    titleEn: '2026 CCP operations training plan for market members',
    categoryKey: 'dao-tao-kiem-thu',
    publishedAt: '2026-01-05T08:00:00.000Z',
    leadVi: 'Chương trình tập huấn chuẩn bị go-live',
    leadEn: 'Training program ahead of go-live',
    paragraphsVi: [
      'CCP VN công bố kế hoạch tập huấn nghiệp vụ CCP, margin call và kết nối hệ thống cho thành viên thị trường trong năm 2026.',
      'Thành viên quan tâm đăng ký qua form liên hệ trên website.',
    ],
    paragraphsEn: [
      'CCP VN announced training on CCP operations, margin calls, and system connectivity for market members in 2026.',
      'Interested members may register via the website contact form.',
    ],
    bannerVi: 'Thông tin mang tính tham khảo.',
    bannerEn: 'Information is for reference only.',
  },
  {
    slugVi: 'kiem-thu-he-thong-uat-dot-1',
    slugEn: 'uat-phase-1',
    titleVi: 'Hoàn thành đợt kiểm thử UAT đầu tiên với 3 thành viên pilot',
    titleEn: 'First UAT phase completed with 3 pilot members',
    categoryKey: 'dao-tao-kiem-thu',
    publishedAt: '2026-02-15T08:00:00.000Z',
    leadVi: 'Milestone kiểm thử hệ thống CCP',
    leadEn: 'CCP system testing milestone',
    paragraphsVi: [
      'Đợt UAT đầu tiên hoàn thành với 3 thành viên pilot, kiểm tra luồng novation, margin và message spec.',
      'Các đợt UAT tiếp theo dự kiến mở rộng trong Q2/2026.',
    ],
    paragraphsEn: [
      'The first UAT phase completed with 3 pilot members, testing novation flows, margin, and message specifications.',
      'Further UAT rounds are planned for Q2/2026.',
    ],
    bannerVi: 'Thông tin mang tính tham khảo.',
    bannerEn: 'Information is for reference only.',
  },
  {
    slugVi: 'bao-cao-quy-bu-tru-q2-2026',
    slugEn: 'default-fund-report-q2-2026',
    titleVi: 'Thông báo tình hình quản lý Quỹ bù trừ Quý II/2026',
    titleEn: 'Default fund management report — Q2 2026',
    categoryKey: 'quy-bu-tru',
    publishedAt: '2026-07-01T08:00:00.000Z',
    leadVi: 'Báo cáo quỹ bù trừ định kỳ',
    leadEn: 'Periodic default fund report',
    paragraphsVi: [
      'CCP VN công bố thông báo tình hình quản lý Quỹ bù trừ Quý II/2026 theo quy định.',
      'Chi tiết báo cáo sẽ được cập nhật khi công ty chính thức vận hành.',
    ],
    paragraphsEn: [
      'CCP VN published the default fund management notice for Q2 2026 per regulations.',
      'Full report details will be updated upon official operations.',
    ],
    bannerVi: 'Thông tin mang tính tham khảo.',
    bannerEn: 'Information is for reference only.',
  },
  {
    slugVi: 'bao-cao-quy-bu-tru-thang-6-2026',
    slugEn: 'default-fund-report-jun-2026',
    titleVi: 'Thông báo tình hình quản lý Quỹ bù trừ tháng 6/2026',
    titleEn: 'Default fund management report — June 2026',
    categoryKey: 'quy-bu-tru',
    publishedAt: '2026-07-05T08:00:00.000Z',
    leadVi: 'Báo cáo quỹ bù trừ hàng tháng',
    leadEn: 'Monthly default fund report',
    paragraphsVi: [
      'Thông báo tình hình quản lý Quỹ bù trừ tháng 6/2026.',
      'Báo cáo định kỳ theo khung PFMI và quy chế tài chính CCP.',
    ],
    paragraphsEn: [
      'Default fund management notice for June 2026.',
      'Periodic reporting per PFMI framework and CCP financial rules.',
    ],
    bannerVi: 'Thông tin mang tính tham khảo.',
    bannerEn: 'Information is for reference only.',
  },
  {
    slugVi: 'du-thao-thong-tu-thay-119',
    slugEn: 'draft-circular-119',
    titleVi: 'Dự thảo Thông tư thay thế 119/2020/TT-BTC — lấy ý kiến',
    titleEn: 'Draft circular replacing 119/2020/TT-BTC — public consultation',
    categoryKey: 'phap-ly',
    publishedAt: '2026-03-01T08:00:00.000Z',
    leadVi: 'Dự thảo thay thế khung pháp lý bù trừ',
    leadEn: 'Draft replacement for clearing legal framework',
    paragraphsVi: [
      'Bộ Tài chính và Ủy ban Chứng khoán Nhà nước dự kiến ban hành Thông tư thay thế 119/2020/TT-BTC trong năm 2026.',
      'Dự thảo đang trong giai đoạn lấy ý kiến các thành viên thị trường.',
    ],
    paragraphsEn: [
      'The Ministry of Finance and State Securities Commission plan to issue a replacement for Circular 119/2020/TT-BTC in 2026.',
      'The draft is under market consultation.',
    ],
    bannerVi: 'Đây là văn bản dự thảo — chưa có hiệu lực pháp lý.',
    bannerEn: 'This is a draft document — not legally effective.',
    bannerStyle: 'warning',
  },
  {
    slugVi: 'huong-dan-ke-toan-ccp',
    slugEn: 'ccp-accounting-guide',
    titleVi: 'Dự kiến hướng dẫn kế toán CCP thay Thông tư 89/2019',
    titleEn: 'Planned CCP accounting guidance replacing Circular 89/2019',
    categoryKey: 'phap-ly',
    publishedAt: '2026-04-10T08:00:00.000Z',
    leadVi: 'Khung kế toán cho CCP',
    leadEn: 'Accounting framework for CCP',
    paragraphsVi: [
      'Dự kiến ban hành hướng dẫn kế toán CCP thay thế Thông tư 89/2019/TT-BTC.',
      'Hướng dẫn sẽ áp dụng cho Công ty Bù trừ Chứng khoán Việt Nam và các thành viên bù trừ.',
    ],
    paragraphsEn: [
      'Accounting guidance for CCP is planned to replace Circular 89/2019/TT-BTC.',
      'Guidance will apply to Vietnam Securities Clearing Corporation and clearing members.',
    ],
    bannerVi: 'Thông tin mang tính tham khảo.',
    bannerEn: 'Information is for reference only.',
  },
  {
    slugVi: 'ban-hanh-quy-che-hoat-dong-ccp',
    slugEn: 'ccp-operating-rules',
    titleVi: 'Ban hành Quy chế hoạt động CCP (dự kiến Q1/2026)',
    titleEn: 'CCP Operating Rules issuance (expected Q1/2026)',
    categoryKey: 'phap-ly',
    publishedAt: '2026-01-20T08:00:00.000Z',
    leadVi: 'Quy chế hoạt động CCP',
    leadEn: 'CCP Operating Rules',
    paragraphsVi: [
      'Quy chế hoạt động CCP dự kiến ban hành trong Q1/2026, quy định novation, margin, default waterfall và quy trình thành viên.',
      'Văn bản sẽ được công bố trên website sau khi có hiệu lực.',
    ],
    paragraphsEn: [
      'CCP Operating Rules are expected in Q1/2026, covering novation, margin, default waterfall, and membership procedures.',
      'Documents will be published on the website upon effectiveness.',
    ],
    bannerVi: 'Thông tin mang tính tham khảo.',
    bannerEn: 'Information is for reference only.',
  },
  {
    slugVi: 'ky-niem-20-nam-vsdc',
    slugEn: 'vsdc-20-years',
    titleVi: 'Hướng tới kỷ niệm 20 năm VSDC — nền tảng triển khai CCP cơ sở',
    titleEn: 'Toward VSDC\'s 20th anniversary — foundation for cash market CCP',
    categoryKey: 'tin-ccp',
    publishedAt: '2025-12-01T08:00:00.000Z',
    leadVi: 'VSDC — nền tảng hạ tầng thị trường',
    leadEn: 'VSDC — market infrastructure foundation',
    paragraphsVi: [
      'VSDC hướng tới kỷ niệm 20 năm thành lập, với CCP thị trường cơ sở là mốc quan trọng tiếp theo.',
      'Công ty Bù trừ Chứng khoán Việt Nam sẽ kế thừa kinh nghiệm bù trừ phái sinh và lưu ký của VSDC.',
      'Tham khảo thêm tại vsd.vn.',
    ],
    paragraphsEn: [
      'VSDC approaches its 20th anniversary, with cash market CCP as the next major milestone.',
      'Vietnam Securities Clearing Corporation will build on VSDC\'s derivatives clearing and depository experience.',
      'Learn more at vsd.vn.',
    ],
    bannerVi: 'Thông tin mang tính tham khảo.',
    bannerEn: 'Information is for reference only.',
  },
]

export function buildPostVi(def: PostDef, args: PostSeedArgs) {
  return asPostData({
    slug: def.slugVi,
    title: def.titleVi,
    _status: 'published',
    publishedAt: def.publishedAt,
    authors: [args.author],
    heroImage: args.heroImage.id,
    meta: {
      description: def.leadVi,
      image: args.heroImage.id,
      title: def.titleVi,
    },
    categories: [args.categoryIds[def.categoryKey]],
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: def.leadVi, version: 1 }],
            direction: 'ltr',
            format: '',
            indent: 0,
            tag: 'h2',
            version: 1,
          },
          ...def.paragraphsVi.map((p) => ({
            type: 'paragraph' as const,
            children: [{ type: 'text' as const, detail: 0, format: 0, mode: 'normal' as const, style: '', text: p, version: 1 }],
            direction: 'ltr' as const,
            format: '',
            indent: 0,
            textFormat: 0,
            textStyle: '',
            version: 1,
          })),
          bannerBlock(def.bannerVi, def.bannerStyle),
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
  })
}

export function buildPostEn(def: PostDef, args: PostSeedArgs) {
  return asPostData({
    slug: def.slugEn,
    title: def.titleEn,
    _status: 'published',
    meta: {
      description: def.leadEn,
      image: args.heroImage.id,
      title: def.titleEn,
    },
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: def.leadEn, version: 1 }],
            direction: 'ltr',
            format: '',
            indent: 0,
            tag: 'h2',
            version: 1,
          },
          ...def.paragraphsEn.map((p) => ({
            type: 'paragraph' as const,
            children: [{ type: 'text' as const, detail: 0, format: 0, mode: 'normal' as const, style: '', text: p, version: 1 }],
            direction: 'ltr' as const,
            format: '',
            indent: 0,
            textFormat: 0,
            textStyle: '',
            version: 1,
          })),
          bannerBlock(def.bannerEn, def.bannerStyle),
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
  })
}
