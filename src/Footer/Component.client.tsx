'use client'

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
  const navItems = data?.navItems || []
  const contactColumns = data?.contactColumns || []
  const copyrightText = data?.copyrightText
  const hasContactInfo = contactColumns.length > 0 || Boolean(copyrightText)

  return (
    <footer
      className="mt-auto border-t border-white/10 bg-black/70 backdrop-blur-md text-white transition-colors"
      data-theme="dark"
    >
      <div className="container py-8">
        <div className="relative flex items-center justify-between gap-4">
          <Link className="flex shrink-0 items-center" href="/">
            <Logo />
          </Link>

          <MobileNavMenu
            items={navItems}
            linkClassName="text-white/90 hover:text-white hover:bg-white/10"
            menuButtonClassName="text-white/80 hover:text-white"
            menuPanelClassName="border-white/15 bg-zinc-900 shadow-black/40"
            variant="footer"
          />

          <nav className="hidden md:flex md:flex-row gap-4">
            {navItems.map(({ link }, i) => {
              return (
                <CMSLink
                  key={i}
                  {...link}
                  className="text-white/80 transition-colors hover:text-white"
                />
              )
            })}
          </nav>
        </div>
      </div>

      {hasContactInfo && (
        <div className="border-t border-white/10">
          <div className={cn('container pt-8', copyrightText ? 'pb-0' : 'pb-8')}>
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
                      <h3 className="mb-4 text-base font-semibold text-white">{column.title}</h3>
                    )}
                    {column.items && column.items.length > 0 && (
                      <ul className="space-y-3">
                        {column.items.map((item, itemIndex) => (
                          <li
                            key={item.id || itemIndex}
                            className="flex gap-3 text-sm leading-relaxed text-white/80"
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
                  contactColumns.length > 0 && 'border-t border-white/10 pt-4 pb-4',
                  !contactColumns.length && 'pb-8',
                )}
              >
                <p className="text-left text-sm text-white/80">{copyrightText}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  )
}
