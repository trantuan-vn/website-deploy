'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { localeCookieName, locales, type Locale } from '@/utilities/locale'
import { useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  currentLocale: Locale
}

export const LocaleSelector: React.FC<Props> = ({ currentLocale }) => {
  const router = useRouter()

  const onLocaleChange = (locale: Locale) => {
    document.cookie = `${localeCookieName}=${locale};path=/;max-age=31536000;SameSite=Lax`
    router.refresh()
  }

  return (
    <Select onValueChange={onLocaleChange} value={currentLocale}>
      <SelectTrigger
        aria-label="Select a language"
        className="w-auto bg-transparent gap-2 border-none"
      >
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {locales.map(({ code, label }) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
