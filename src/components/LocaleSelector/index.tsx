'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { localeCookieName, locales, type Locale } from '@/utilities/locale'
import { Globe } from 'lucide-react'
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

  const currentLabel = locales.find((l) => l.code === currentLocale)?.label ?? currentLocale

  return (
    <Select onValueChange={onLocaleChange} value={currentLocale}>
      <SelectTrigger
        aria-label={`Language: ${currentLabel}`}
        className="w-9 h-9 p-0 border-none bg-transparent hover:bg-accent/50 rounded-md flex items-center justify-center [&>svg:last-child]:hidden"
      >
        <Globe className="w-5 h-5 text-primary" />
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map(({ code, label }) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
