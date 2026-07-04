'use client'

import { Menu, X } from 'lucide-react'
import React, { useEffect, useId, useRef, useState } from 'react'

import type { Footer, Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/ui'

type NavItem = NonNullable<Header['navItems']>[number] | NonNullable<Footer['navItems']>[number]

interface MobileNavMenuProps {
  items: NavItem[]
  linkClassName?: string
  menuButtonClassName?: string
  variant?: 'header' | 'footer'
}

export const MobileNavMenu: React.FC<MobileNavMenuProps> = ({
  items,
  linkClassName,
  menuButtonClassName,
  variant = 'header',
}) => {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (items.length === 0) return null

  const navLinks = items.map(({ link }, index) => (
    <div key={index} onClick={() => setOpen(false)}>
      <CMSLink
        {...link}
        appearance={variant === 'header' ? 'link' : undefined}
        className={cn(
          variant === 'header'
            ? 'block px-4 py-2 text-sm font-medium no-underline transition-colors'
            : 'block py-1 text-sm transition-colors',
          linkClassName,
        )}
      />
    </div>
  ))

  if (variant === 'footer') {
    return (
      <div className="shrink-0 md:hidden" ref={menuRef}>
        <button
          type="button"
          aria-controls={menuId}
          aria-expanded={open}
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          className={cn(
            'flex items-center gap-2 text-sm font-medium transition-colors',
            menuButtonClassName,
          )}
          onClick={() => setOpen(open ? false : true)}
        >
          {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
          <span>Menu</span>
        </button>

        {open && (
          <nav
            className="absolute inset-x-0 top-full z-10 mt-4 flex flex-col gap-2 border-t border-border/50 pt-4"
            id={menuId}
          >
            {navLinks}
          </nav>
        )}
      </div>
    )
  }

  return (
    <div className="relative md:hidden" ref={menuRef}>
      <button
        type="button"
        aria-controls={menuId}
        aria-expanded={open}
        aria-label={open ? 'Đóng menu' : 'Mở menu'}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-accent/50',
          menuButtonClassName,
        )}
        onClick={() => setOpen(open ? false : true)}
      >
        {open ? (
          <X aria-hidden className="h-5 w-5 text-primary" />
        ) : (
          <Menu aria-hidden className="h-5 w-5 text-primary" />
        )}
      </button>

      {open && (
        <nav
          className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] rounded-md border border-border/50 bg-background py-2 shadow-lg"
          id={menuId}
        >
          {navLinks}
        </nav>
      )}
    </div>
  )
}
