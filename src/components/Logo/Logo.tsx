import clsx from 'clsx'
import Image from 'next/image'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { className, loading = 'lazy', priority } = props
  const imageClassName = clsx('h-8 w-auto', className)

  return (
    <span className="inline-flex items-center">
      <Image
        src="/logo_tight_light.svg"
        alt="Công ty Bù trừ Chứng khoán Việt Nam"
        width={1885}
        height={359}
        className={clsx(imageClassName, 'logo-theme-light')}
        loading={loading}
        priority={priority === 'high'}
        unoptimized
      />
      <Image
        src="/logo_tight.svg"
        alt=""
        aria-hidden
        width={1885}
        height={359}
        className={clsx(imageClassName, 'logo-theme-dark')}
        loading={loading}
        priority={priority === 'high'}
        unoptimized
      />
    </span>
  )
}
