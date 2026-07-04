export const locales = [
  { label: 'Tiếng Việt', code: 'vi' },
  { label: 'English', code: 'en' },
] as const

export type Locale = (typeof locales)[number]['code']

export const defaultLocale: Locale = 'vi'

export const localeCookieName = 'payload-locale'

export function isValidLocale(value: string): value is Locale {
  return locales.some((locale) => locale.code === value)
}
