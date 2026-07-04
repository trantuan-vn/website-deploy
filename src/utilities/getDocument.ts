import type { Config } from '@/payload-types'

import { unstable_cache } from 'next/cache'

import { findDocumentBySlug } from './findDocumentBySlug'
import { defaultLocale, type Locale } from './locale'

type Collection = keyof Config['collections']

async function getDocument(
  collection: Collection,
  slug: string,
  _depth = 0,
  locale: Locale = defaultLocale,
) {
  return findDocumentBySlug({
    collection,
    locale,
    slug,
  })
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedDocument = (
  collection: Collection,
  slug: string,
  locale: Locale = defaultLocale,
) =>
  unstable_cache(async () => getDocument(collection, slug, 0, locale), [collection, slug, locale], {
    tags: [`${collection}_${slug}`],
  })
