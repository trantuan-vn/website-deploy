import { cookies } from 'next/headers'

import { defaultLocale, isValidLocale, localeCookieName, type Locale } from '@/utilities/locale'

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(localeCookieName)?.value

  if (value && isValidLocale(value)) {
    return value
  }

  return defaultLocale
}
