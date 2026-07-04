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

export function footerContactVi() {
  return {
    contactColumns: [
      {
        title: 'Trụ sở chính',
        items: [
          {
            icon: 'location' as const,
            text: 'Số 112 đường Hoàng Quốc Việt, Phường Nghĩa Đô, Thành phố Hà Nội',
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
            icon: 'phone' as const,
            text: 'Hotline: 024 3978 5669',
          },
        ],
      },
      {
        title: 'Chi nhánh',
        items: [
          {
            icon: 'location' as const,
            text: 'Địa chỉ theo GCN ĐKKD: Số 16 Võ Văn Kiệt, Phường Nguyễn Thái Bình, Quận 1, Tp HCM',
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
    copyrightText:
      '©2020 Bản quyền thuộc về Tổng công ty Lưu ký và Bù trừ chứng khoán Việt Nam',
  }
}

export function footerContactEn() {
  return {
    contactColumns: [
      {
        title: 'Headquarters',
        items: [
          {
            icon: 'location' as const,
            text: '112 Hoang Quoc Viet Street, Nghia Do Ward, Hanoi City',
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
            icon: 'phone' as const,
            text: 'Hotline: 024 3978 5669',
          },
        ],
      },
      {
        title: 'Branch',
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
    copyrightText:
      '©2020 Copyright Vietnam Securities Depository and Clearing Corporation',
  }
}
