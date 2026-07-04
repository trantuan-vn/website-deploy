import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getLocale } from '@/utilities/locale.server'
import React from 'react'

export async function Header() {
  const locale = await getLocale()
  const headerData = await getCachedGlobal('header', 1, locale)()

  return <HeaderClient data={headerData} locale={locale} />
}
