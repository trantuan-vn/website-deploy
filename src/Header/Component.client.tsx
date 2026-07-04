'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'
import type { Locale } from '@/utilities/locale'

import { Logo } from '@/components/Logo/Logo'
import { cn } from '@/utilities/ui'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
  locale: Locale
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, locale }) => {
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  const isDarkHeader = theme === 'dark'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-colors',
        isDarkHeader
          ? 'border-white/10 bg-black/70 backdrop-blur-md'
          : 'border-border/50 bg-background/80 backdrop-blur-md',
      )}
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container py-4 flex justify-between items-center">
        <Link href="/">
          <Logo
            loading="eager"
            priority="high"
            className={cn(isDarkHeader && 'text-white')}
          />
        </Link>
        <HeaderNav data={data} locale={locale} />
      </div>
    </header>
  )
}
