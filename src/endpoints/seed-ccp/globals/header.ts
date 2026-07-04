import type { PageIds } from '../helpers/types'

export function headerNav(pageIds: PageIds) {
  return {
    navItems: [
      {
        link: {
          type: 'reference' as const,
          label: 'Trang chủ',
          reference: { relationTo: 'pages' as const, value: String(pageIds.home) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: 'Giới thiệu',
          reference: { relationTo: 'pages' as const, value: String(pageIds['gioi-thieu']) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: 'Mô hình CCP',
          reference: { relationTo: 'pages' as const, value: String(pageIds['mo-hinh-ccp']) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: 'Quản trị rủi ro',
          reference: { relationTo: 'pages' as const, value: String(pageIds['quan-tri-rui-ro']) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: 'Thành viên',
          reference: { relationTo: 'pages' as const, value: String(pageIds['thanh-vien']) },
        },
      },
      {
        link: {
          type: 'custom' as const,
          label: 'Tin tức',
          url: '/posts',
        },
      },
    ],
  }
}
