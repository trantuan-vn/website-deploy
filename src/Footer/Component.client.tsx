'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useTheme } from '@/providers/Theme'
import Link from 'next/link'
import { MapPin, Phone, Printer } from 'lucide-react'
import React from 'react'

import type { Footer as FooterType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { MobileNavMenu } from '@/components/MobileNavMenu'
import { cn } from '@/utilities/ui'

interface FooterClientProps {
  data: FooterType
}

type ContactIconType = 'location' | 'phone' | 'fax' | 'none' | null | undefined

function ContactIcon({ type }: { type: ContactIconType }) {
  const className = 'h-4 w-4 shrink-0 mt-0.5'

  switch (type) {
    case 'location':
      return <MapPin aria-hidden className={className} />
    case 'phone':
      return <Phone aria-hidden className={className} />
    case 'fax':
      return <Printer aria-hidden className={className} />
    default:
      return null
  }
}

export const FooterClient: React.FC<FooterClientProps> = ({ data }) => {
  const { headerTheme } = useHeaderTheme()
  const { theme: globalTheme } = useTheme()
  const effectiveTheme = headerTheme ?? globalTheme ?? 'light'
  const isDarkFooter = effectiveTheme === 'dark'
  const navItems = data?.navItems || []
  const contactColumns = data?.contactColumns || []
  const copyrightText = data?.copyrightText
  const hasContactInfo = contactColumns.length > 0 || Boolean(copyrightText)

  const mutedTextClass = isDarkFooter ? 'text-white/80' : 'text-foreground/80'
  const headingClass = isDarkFooter ? 'text-white' : 'text-foreground'

  return (
    <footer
      className={cn(
        'mt-auto border-t transition-colors',
        isDarkFooter
          ? 'border-white/10 bg-black/70 backdrop-blur-md text-white'
          : 'border-border/50 bg-background/80 backdrop-blur-md',
      )}
      {...(headerTheme ? { 'data-theme': headerTheme } : {})}
    >
      <div className="container py-8">
        <div className="relative flex items-center justify-between gap-4">
          <Link className="flex shrink-0 items-center" href="/">
            <Logo />
          </Link>

          <MobileNavMenu
            items={navItems}
            linkClassName={
              isDarkFooter
                ? 'text-white/80 hover:text-white'
                : 'text-foreground/80 hover:text-foreground'
            }
            menuButtonClassName={
              isDarkFooter ? 'text-white/80 hover:text-white' : 'text-foreground/80 hover:text-foreground'
            }
            variant="footer"
          />

          <nav className="hidden md:flex md:flex-row gap-4">
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

      {hasContactInfo && (
        <div
          className={cn(
            'border-t',
            isDarkFooter ? 'border-white/10' : 'border-border/50',
          )}
        >
          <div
            className={cn(
              'container pt-8',
              copyrightText ? 'pb-0' : 'pb-8',
            )}
          >
            {contactColumns.length > 0 && (
              <div
                className={cn(
                  'grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3',
                  copyrightText && 'pb-8',
                )}
              >
                {contactColumns.map((column, columnIndex) => (
                  <div key={column.id || columnIndex}>
                    {column.title && (
                      <h3 className={cn('mb-4 text-base font-semibold', headingClass)}>
                        {column.title}
                      </h3>
                    )}
                    {column.items && column.items.length > 0 && (
                      <ul className="space-y-3">
                        {column.items.map((item, itemIndex) => (
                          <li
                            key={item.id || itemIndex}
                            className={cn('flex gap-3 text-sm leading-relaxed', mutedTextClass)}
                          >
                            <ContactIcon type={item.icon} />
                            <span>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {copyrightText && (
              <div
                className={cn(
                  contactColumns.length > 0 && 'border-t pt-4 pb-4',
                  contactColumns.length > 0 &&
                    (isDarkFooter ? 'border-white/10' : 'border-border/50'),
                  !contactColumns.length && 'pb-8',
                )}
              >
                <p className={cn('text-left text-sm', mutedTextClass)}>{copyrightText}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  )
}
