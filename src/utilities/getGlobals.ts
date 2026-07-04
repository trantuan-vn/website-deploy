import type { Config } from '@/payload-types'

import configPromise from '@payload-config'
import { type DataFromGlobalSlug, getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { defaultLocale, type Locale } from './locale'

type Global = keyof Config['globals']

async function getGlobal<T extends Global>(
  slug: T,
  depth = 0,
  locale: Locale = defaultLocale,
): Promise<DataFromGlobalSlug<T>> {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
    locale,
  })

  return global
}

type CachedGlobalFn<T extends Global> = () => Promise<DataFromGlobalSlug<T>>

const cachedGlobalFns = new Map<string, CachedGlobalFn<Global>>()

/**
 * Returns a stable unstable_cache function for the slug/locale.
 * Instances are memoized at module level so revalidateTag can invalidate them.
 */
export const getCachedGlobal = <T extends Global>(
  slug: T,
  depth = 0,
  locale: Locale = defaultLocale,
): CachedGlobalFn<T> => {
  const cacheKey = `${slug}:${depth}:${locale}`

  if (!cachedGlobalFns.has(cacheKey)) {
    cachedGlobalFns.set(
      cacheKey,
      unstable_cache(async () => getGlobal<T>(slug, depth, locale), [slug, String(depth), locale], {
        tags: [`global_${slug}`],
      }),
    )
  }

  return cachedGlobalFns.get(cacheKey)! as CachedGlobalFn<T>
}
