import type { PageIds } from '../helpers/types'

export function footerNav(pageIds: PageIds) {
  return {
    navItems: [
      {
        link: {
          type: 'reference' as const,
          label: 'Quy chế',
          reference: { relationTo: 'pages' as const, value: String(pageIds['quy-che']) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: 'Công bố thông tin',
          reference: {
            relationTo: 'pages' as const,
            value: String(pageIds['cong-bo-thong-tin']),
          },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: 'Lộ trình',
          reference: { relationTo: 'pages' as const, value: String(pageIds['lo-trinh']) },
        },
      },
      {
        link: {
          type: 'reference' as const,
          label: 'Liên hệ',
          reference: { relationTo: 'pages' as const, value: String(pageIds['lien-he']) },
        },
      },
      {
        link: {
          type: 'custom' as const,
          label: 'VSDC.vn',
          url: 'https://vsd.vn',
          newTab: true,
        },
      },
      {
        link: {
          type: 'custom' as const,
          label: 'Cổng quản trị',
          url: '/admin',
        },
      },
    ],
  }
}
