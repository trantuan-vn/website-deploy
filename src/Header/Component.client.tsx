'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useTheme } from '@/providers/Theme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

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
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const { theme: globalTheme } = useTheme()
  const pathname = usePathname()
  const isFirstPathnameEffect = useRef(true)
  const effectiveTheme = headerTheme ?? globalTheme ?? 'light'
  const isDarkHeader = effectiveTheme === 'dark'

  useEffect(() => {
    if (isFirstPathnameEffect.current) {
      isFirstPathnameEffect.current = false
      return
    }

    setHeaderTheme(null)
  }, [pathname, setHeaderTheme])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-colors',
        isDarkHeader
          ? 'border-white/10 bg-black/70 backdrop-blur-md'
          : 'border-border/50 bg-background/80 backdrop-blur-md',
      )}
      {...(headerTheme ? { 'data-theme': headerTheme } : {})}
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
