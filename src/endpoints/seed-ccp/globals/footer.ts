import type { Footer } from '@/payload-types'

import type { PageIds } from '../helpers/types'

const FOOTER_LABELS = {
  vi: {
    rules: 'Quy chế',
    disclosure: 'Công bố thông tin',
    roadmap: 'Lộ trình',
    contact: 'Liên hệ',
  },
  en: {
    rules: 'Rules & Regulations',
    disclosure: 'Disclosure',
    roadmap: 'Roadmap',
    contact: 'Contact',
  },
} as const

function buildFooterNav(pageIds: PageIds, labels: (typeof FOOTER_LABELS)[keyof typeof FOOTER_LABELS]) {
  return {
    navItems: [
      {
        link: {
          type: 'reference' as const,
          label: labels.rules,
          reference: { relationTo: 'pages' as const, value: String(pageIds['quy-che']) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: labels.disclosure,
          reference: {
            relationTo: 'pages' as const,
            value: String(pageIds['cong-bo-thong-tin']),
          },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: labels.roadmap,
          reference: { relationTo: 'pages' as const, value: String(pageIds['lo-trinh']) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: labels.contact,
          reference: { relationTo: 'pages' as const, value: String(pageIds['lien-he']) },
        },
      },
    ],
  }
}

const FOOTER_EN_LABELS = [
  FOOTER_LABELS.en.rules,
  FOOTER_LABELS.en.disclosure,
  FOOTER_LABELS.en.roadmap,
  FOOTER_LABELS.en.contact,
] as const

export function footerNav(pageIds: PageIds) {
  return buildFooterNav(pageIds, FOOTER_LABELS.vi)
}

/** Apply English labels to existing nav items (preserves array row IDs for locale update). */
export function footerNavEnFromExisting(navItems: Footer['navItems']) {
  return {
    navItems: navItems?.map((item, index) => ({
      id: item.id,
      link: {
        type: item.link.type,
        newTab: item.link.newTab,
        reference: item.link.reference,
        url: item.link.url,
        label: FOOTER_EN_LABELS[index] ?? item.link.label,
      },
    })),
  }
}

export function footerContactVi() {
  return {
    contactColumns: [
      {
        title: 'Trụ sở chính:',
        items: [
          {
            icon: 'location' as const,
            text: 'Số 112 đường Hoàng Quốc Việt, Phường Nghĩa Đô, Thành phố Hà Nội,',
          },
          {
            icon: 'phone' as const,
            text: '(+84.24) 3 9747 123',
          },
          {
            icon: 'fax' as const,
            text: '(+84.24) 3 9747 120',
          },
          {
            icon: 'none' as const,
            text: 'Hotline: 024 3978 5669',
          },
        ],
      },
      {
        title: 'Chi nhánh:',
        items: [
          {
            icon: 'location' as const,
            text: 'Địa chỉ theo GCN ĐKKD : Số 16 Võ Văn Kiệt, Phường Nguyễn Thái Bình, Quận 1, Tp HCM',
          },
          {
            icon: 'location' as const,
            text: 'Địa chỉ liên hệ và gửi thư: Tầng 7, tòa nhà Exchange Tower, số 1 đường Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Tp HCM',
          },
          {
            icon: 'phone' as const,
            text: '(+84.28) 3 9330 755',
          },
          {
            icon: 'fax' as const,
            text: '(+84.28) 3 9330 754',
          },
        ],
      },
    ],
    copyrightText: '©2026 Bản quyền thuộc về Công ty Bù trừ chứng khoán Việt Nam',
  }
}

/** Apply English contact info to existing columns (preserves array row IDs for locale update). */
export function footerContactEnFromExisting(contactColumns: Footer['contactColumns']) {
  const en = footerContactEn()

  return {
    contactColumns: contactColumns?.map((column, columnIndex) => ({
      id: column.id,
      title: en.contactColumns[columnIndex]?.title ?? column.title,
      items: column.items?.map((item, itemIndex) => ({
        id: item.id,
        icon: item.icon,
        text: en.contactColumns[columnIndex]?.items[itemIndex]?.text ?? item.text,
      })),
    })),
    copyrightText: en.copyrightText,
  }
}

export function footerContactEn() {
  return {
    contactColumns: [
      {
        title: 'Headquarters:',
        items: [
          {
            icon: 'location' as const,
            text: '112 Hoang Quoc Viet Street, Nghia Do Ward, Hanoi City,',
          },
          {
            icon: 'phone' as const,
            text: '(+84.24) 3 9747 123',
          },
          {
            icon: 'fax' as const,
            text: '(+84.24) 3 9747 120',
          },
          {
            icon: 'none' as const,
            text: 'Hotline: 024 3978 5669',
          },
        ],
      },
      {
        title: 'Branch:',
        items: [
          {
            icon: 'location' as const,
            text: 'Registered address (per Business Registration Certificate): 16 Vo Van Kiet, Nguyen Thai Binh Ward, District 1, Ho Chi Minh City',
          },
          {
            icon: 'location' as const,
            text: 'Contact and mailing address: 7th Floor, Exchange Tower, 1 Nam Ky Khoi Nghia Street, Ben Thanh Ward, Ho Chi Minh City',
          },
          {
            icon: 'phone' as const,
            text: '(+84.28) 3 9330 755',
          },
          {
            icon: 'fax' as const,
            text: '(+84.28) 3 9330 754',
          },
        ],
      },
    ],
    copyrightText: '©2026 Copyright Vietnam Central Counterparty Corporation',
  }
}
