import { FooterClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getLocale } from '@/utilities/locale.server'
import React from 'react'

export async function Footer() {
  const locale = await getLocale()
  const footerData = await getCachedGlobal('footer', 1, locale)()

  return <FooterClient data={footerData} />
}
