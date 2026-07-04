import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHeroes } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { cn } from '@/utilities/ui'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { safeBuildStaticParams } from '@/utilities/safeBuildStaticParams'
import { findDocumentBySlug } from '@/utilities/findDocumentBySlug'
import { getLocale } from '@/utilities/locale.server'

export async function generateStaticParams() {
  return safeBuildStaticParams(async () => {
    const payload = await getPayload({ config: configPromise })
    const pages = await payload.find({
      collection: 'pages',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
    })

    return (
      pages.docs
        ?.filter((doc) => {
          return doc.slug !== 'home'
        })
        .map(({ slug }) => {
          return { slug }
        }) ?? []
    )
  })
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const locale = await getLocale()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug: decodedSlug,
    locale,
  })

  // Dev-only placeholder when the DB is empty. In production an empty DB should 404, not
  // look like a fresh template after every redeploy.
  if (!page && slug === 'home' && process.env.NODE_ENV !== 'production') {
    page = homeStatic
  }

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { heroes, layout } = page
  const isFullBleedHero = (heroes || []).some((hero) => hero.type === 'highImpact')

  return (
    <article className={cn('pb-24', !isFullBleedHero && 'pt-16')}>
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHeroes heroes={heroes} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const locale = await getLocale()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug({
    slug: decodedSlug,
    locale,
  })

  return generateMeta({ doc: page })
}

const queryPageBySlug = cache(async ({ slug, locale }: { slug: string; locale: Awaited<ReturnType<typeof getLocale>> }) => {
  const { isEnabled: draft } = await draftMode()

  return findDocumentBySlug({
    collection: 'pages',
    draft,
    locale,
    overrideAccess: draft,
    slug,
  })
})
