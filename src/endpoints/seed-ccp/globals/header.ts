import type { Header } from '@/payload-types'

import type { PageIds } from '../helpers/types'

const HEADER_LABELS = {
  vi: {
    home: 'Trang chủ',
    about: 'Giới thiệu',
    model: 'Mô hình CCP',
    risk: 'Quản trị rủi ro',
    members: 'Thành viên',
    news: 'Tin tức',
  },
  en: {
    home: 'Home',
    about: 'About',
    model: 'CCP Model',
    risk: 'Risk Management',
    members: 'Clearing Members',
    news: 'News',
  },
} as const

function buildHeaderNav(pageIds: PageIds, labels: (typeof HEADER_LABELS)[keyof typeof HEADER_LABELS]) {
  return {
    navItems: [
      {
        link: {
          type: 'reference' as const,
          label: labels.home,
          reference: { relationTo: 'pages' as const, value: String(pageIds.home) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: labels.about,
          reference: { relationTo: 'pages' as const, value: String(pageIds['gioi-thieu']) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: labels.model,
          reference: { relationTo: 'pages' as const, value: String(pageIds['mo-hinh-ccp']) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: labels.risk,
          reference: { relationTo: 'pages' as const, value: String(pageIds['quan-tri-rui-ro']) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: labels.members,
          reference: { relationTo: 'pages' as const, value: String(pageIds['thanh-vien']) },
        },
      },
      {
        link: {
          type: 'custom' as const,
          label: labels.news,
          url: '/posts',
        },
      },
    ],
  }
}

const HEADER_EN_LABELS = [
  HEADER_LABELS.en.home,
  HEADER_LABELS.en.about,
  HEADER_LABELS.en.model,
  HEADER_LABELS.en.risk,
  HEADER_LABELS.en.members,
  HEADER_LABELS.en.news,
] as const

export function headerNav(pageIds: PageIds) {
  return buildHeaderNav(pageIds, HEADER_LABELS.vi)
}

/** Apply English labels to existing nav items (preserves array row IDs for locale update). */
export function headerNavEnFromExisting(navItems: Header['navItems']) {
  return {
    navItems: navItems?.map((item, index) => ({
      id: item.id,
      link: {
        type: item.link.type,
        newTab: item.link.newTab,
        reference: item.link.reference,
        url: item.link.url,
        label: HEADER_EN_LABELS[index] ?? item.link.label,
      },
    })),
  }
}
