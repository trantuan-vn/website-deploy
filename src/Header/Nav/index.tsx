'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'
import type { Locale } from '@/utilities/locale'

import { LocaleSelector } from '@/components/LocaleSelector'
import { CMSLink } from '@/components/Link'
import { MobileNavMenu } from '@/components/MobileNavMenu'
import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import Link from 'next/link'
import { SearchIcon } from 'lucide-react'
import { cn } from '@/utilities/ui'

export const HeaderNav: React.FC<{ data: HeaderType; locale: Locale }> = ({ data, locale }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="flex gap-1 items-center">
      <MobileNavMenu
        items={navItems}
        linkClassName="text-white/90 hover:text-white hover:bg-white/10"
        menuButtonClassName="text-white/80 hover:text-white hover:bg-white/10"
        menuPanelClassName="border-white/15 bg-zinc-900 shadow-black/40"
        variant="header"
      />

      <div className="hidden md:flex items-center gap-1 mr-2">
        {navItems.map(({ link }, i) => {
          return (
            <CMSLink
              key={i}
              {...link}
              appearance="link"
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium no-underline',
                'text-white/80 hover:text-white hover:bg-white/10',
                'transition-colors',
              )}
            />
          )
        })}
      </div>

      <div className="flex items-center gap-0.5">
        <ThemeSelector />
        <LocaleSelector currentLocale={locale} />
        <Link
          href="/search"
          className="w-9 h-9 flex items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span className="sr-only">Search</span>
          <SearchIcon className="w-5 h-5" />
        </Link>
      </div>
    </nav>
  )
}
