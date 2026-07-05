'use client'
import Link from 'next/link'
import React from 'react'

import type { Header } from '@/payload-types'
import type { Locale } from '@/utilities/locale'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
  locale: Locale
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, locale }) => {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-md transition-colors"
      data-theme="dark"
    >
      <div className="container py-4 flex justify-between items-center">
        <Link href="/">
          <Logo loading="eager" priority="high" />
        </Link>
        <HeaderNav data={data} locale={locale} />
      </div>
    </header>
  )
}
