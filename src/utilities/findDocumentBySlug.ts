import configPromise from '@payload-config'
import { getPayload, type CollectionSlug, type DataFromCollectionSlug } from 'payload'

import { defaultLocale, type Locale } from './locale'

type Args<T extends CollectionSlug> = {
  collection: T
  slug: string
  locale: Locale
  draft?: boolean
  overrideAccess?: boolean
}

/**
 * Finds a document by slug when slug is localized.
 * Payload filters on the requested locale's slug only — fallbackLocale does not apply to queries.
 * Resolve the document id from defaultLocale, then fetch in the requested locale.
 */
export async function findDocumentBySlug<T extends CollectionSlug>({
  collection,
  slug,
  locale,
  draft = false,
  overrideAccess = false,
}: Args<T>): Promise<DataFromCollectionSlug<T> | null> {
  const payload = await getPayload({ config: configPromise })

  const idResult = await payload.find({
    collection,
    draft,
    limit: 1,
    locale: defaultLocale,
    overrideAccess: draft || overrideAccess,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const id = idResult.docs?.[0]?.id
  if (!id) return null

  if (locale === defaultLocale) {
    return idResult.docs[0] as DataFromCollectionSlug<T>
  }

  try {
    const doc = await payload.findByID({
      collection,
      id,
      draft,
      fallbackLocale: defaultLocale,
      locale,
      overrideAccess: draft || overrideAccess,
    })

    return doc as DataFromCollectionSlug<T>
  } catch {
    // Non-default locale may be draft or missing — serve the published default locale.
    return idResult.docs[0] as DataFromCollectionSlug<T>
  }
}
