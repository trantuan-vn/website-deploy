import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Liên kết',
          fields: [
            {
              name: 'navItems',
              type: 'array',
              fields: [
                link({
                  appearances: false,
                  localizedLabel: true,
                }),
              ],
              maxRows: 6,
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: '@/Footer/RowLabel#RowLabel',
                },
              },
            },
          ],
        },
        {
          label: 'Thông tin liên hệ',
          fields: [
            {
              name: 'contactColumns',
              type: 'array',
              label: 'Cột thông tin',
              maxRows: 3,
              admin: {
                description:
                  'Thêm các cột thông tin liên hệ (ví dụ: Trụ sở chính, Chi nhánh). Nội dung hỗ trợ đa ngôn ngữ.',
                initCollapsed: true,
                components: {
                  RowLabel: '@/Footer/ContactColumnRowLabel#ContactColumnRowLabel',
                },
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  label: 'Tiêu đề cột',
                  localized: true,
                  required: true,
                },
                {
                  name: 'items',
                  type: 'array',
                  label: 'Dòng thông tin',
                  admin: {
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      name: 'icon',
                      type: 'select',
                      label: 'Icon',
                      defaultValue: 'none',
                      options: [
                        { label: 'Địa chỉ', value: 'location' },
                        { label: 'Điện thoại', value: 'phone' },
                        { label: 'Fax', value: 'fax' },
                        { label: 'Không icon', value: 'none' },
                      ],
                    },
                    {
                      name: 'text',
                      type: 'textarea',
                      label: 'Nội dung',
                      localized: true,
                      required: true,
                    },
                  ],
                },
              ],
            },
            {
              name: 'copyrightText',
              type: 'text',
              label: 'Bản quyền',
              localized: true,
              admin: {
                description: 'Dòng bản quyền hiển thị ở cuối footer',
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
  versions: false,
}
