'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import type { Footer as FooterType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { cn } from '@/utilities/ui'

interface FooterClientProps {
  data: FooterType
}

export const FooterClient: React.FC<FooterClientProps> = ({ data }) => {
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme } = useHeaderTheme()

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  const isDarkFooter = theme === 'dark'
  const navItems = data?.navItems || []

  return (
    <footer
      className={cn(
        'mt-auto border-t transition-colors',
        isDarkFooter
          ? 'border-white/10 bg-black/70 backdrop-blur-md text-white'
          : 'border-border/50 bg-background/80 backdrop-blur-md',
      )}
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo className={cn(isDarkFooter && 'text-white')} />
        </Link>

        <div className="flex flex-col items-start md:flex-row gap-4 md:items-center">
          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ link }, i) => {
              return (
                <CMSLink
                  key={i}
                  {...link}
                  className={cn(
                    'transition-colors',
                    isDarkFooter
                      ? 'text-white/80 hover:text-white'
                      : 'text-foreground/80 hover:text-foreground',
                  )}
                />
              )
            })}
          </nav>
        </div>
      </div>
    </footer>
  )
}
