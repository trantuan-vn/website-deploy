'use client'

import type { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const ContactColumnRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Footer['contactColumns']>[number]>()

  const label = data?.data?.title
    ? `Cột ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${data.data.title}`
    : 'Cột thông tin'

  return <div>{label}</div>
}
