import type { CollectionAfterReadHook, CollectionBeforeChangeHook } from 'payload'

import type { Page } from '@/payload-types'

type LegacyPage = Page & {
  hero?: Page['heroes'] extends (infer Item)[] | null | undefined ? Item : never
}

function normalizeHeroes(doc: LegacyPage): LegacyPage {
  if ((!doc.heroes || doc.heroes.length === 0) && doc.hero) {
    doc.heroes = [doc.hero]
  }

  return doc
}

export const migrateLegacyHero: CollectionAfterReadHook<Page> = ({ doc }) => {
  return normalizeHeroes(doc as LegacyPage)
}

export const migrateLegacyHeroBeforeChange: CollectionBeforeChangeHook<Page> = ({ data }) => {
  return normalizeHeroes(data as LegacyPage)
}
