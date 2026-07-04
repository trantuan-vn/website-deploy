import type { CollectionSlug, Payload, PayloadRequest, RequiredDataFromCollectionSlug } from 'payload'
import type { Post } from '@/payload-types'

import { CCP_CATEGORIES } from './categories'
import { memberContactForm } from './form-member-contact'
import { footerContactEn, footerContactVi, footerNav } from './globals/footer'
import { headerNav } from './globals/header'
import { fetchFileByURL, IMAGE_URLS, MEDIA_ALT } from './images'
import {
  gioiThieuEn,
  gioiThieuVi,
  moHinhCcpEn,
  moHinhCcpVi,
  quanTriRuiRoEn,
  quanTriRuiRoVi,
  thanhVienEn,
  thanhVienVi,
} from './pages/about-model-risk-members'
import { homeEn, homeVi } from './pages/home'
import {
  congBoThongTinEn,
  congBoThongTinVi,
  daoTaoEn,
  daoTaoVi,
  heThongEn,
  heThongVi,
  lienHeEn,
  lienHeVi,
  loTrinhEn,
  loTrinhVi,
  quyCheEn,
  quyCheVi,
} from './pages/remaining'
import { POST_DEFINITIONS, buildPostEn, buildPostVi } from './posts'
import type { CategoryIds, PageIds, PageSeedArgs, SeedMedia } from './helpers/types'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'search',
]

const DEMO_AUTHOR_EMAIL = 'ccp-admin@vsd.vn'

export const seedCcp = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding CCP website database...')

  payload.logger.info('— Clearing collections and globals...')

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: { navItems: [] },
      depth: 0,
      context: { disableRevalidate: true },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: { navItems: [], contactColumns: [], copyrightText: '' },
      depth: 0,
      context: { disableRevalidate: true },
    }),
  ])

  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  payload.logger.info('— Seeding demo author...')

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: { email: { equals: DEMO_AUTHOR_EMAIL } },
  })

  payload.logger.info('— Seeding media...')

  const [
    heroHomeBuffer,
    heroAboutBuffer,
    heroModelBuffer,
    heroRiskBuffer,
    heroRoadmapBuffer,
    metaDefaultBuffer,
  ] = await Promise.all([
    fetchFileByURL(IMAGE_URLS.heroHome),
    fetchFileByURL(IMAGE_URLS.heroAbout),
    fetchFileByURL(IMAGE_URLS.heroModel),
    fetchFileByURL(IMAGE_URLS.heroRisk),
    fetchFileByURL(IMAGE_URLS.heroRoadmap),
    fetchFileByURL(IMAGE_URLS.metaDefault),
  ])

  const [demoAuthor, heroHome, heroAbout, heroModel, heroRisk, heroRoadmap, metaDefault] =
    await Promise.all([
      payload.create({
        collection: 'users',
        data: {
          name: 'CCP Admin',
          email: DEMO_AUTHOR_EMAIL,
          password: 'password',
        },
      }),
      payload.create({
        collection: 'media',
        data: { alt: MEDIA_ALT.heroHome },
        file: heroHomeBuffer,
      }),
      payload.create({
        collection: 'media',
        data: { alt: MEDIA_ALT.heroAbout },
        file: heroAboutBuffer,
      }),
      payload.create({
        collection: 'media',
        data: { alt: MEDIA_ALT.heroModel },
        file: heroModelBuffer,
      }),
      payload.create({
        collection: 'media',
        data: { alt: MEDIA_ALT.heroRisk },
        file: heroRiskBuffer,
      }),
      payload.create({
        collection: 'media',
        data: { alt: MEDIA_ALT.heroRoadmap },
        file: heroRoadmapBuffer,
      }),
      payload.create({
        collection: 'media',
        data: { alt: MEDIA_ALT.metaDefault },
        file: metaDefaultBuffer,
      }),
    ])

  const media: SeedMedia = {
    heroHome,
    heroAbout,
    heroModel,
    heroRisk,
    heroRoadmap,
    metaDefault,
  }

  payload.logger.info('— Seeding categories...')

  const categoryDocs = await Promise.all(
    CCP_CATEGORIES.map((cat) =>
      payload.create({
        collection: 'categories',
        data: { title: cat.title, slug: cat.slug },
      }),
    ),
  )

  const categoryIds: CategoryIds = {}
  for (const cat of CCP_CATEGORIES) {
    const doc = categoryDocs.find((d) => d.slug === cat.slug)
    if (doc) categoryIds[cat.slug] = doc.id
  }

  payload.logger.info('— Seeding contact form...')

  const form = await payload.create({
    collection: 'forms',
    depth: 0,
    data: memberContactForm,
  })

  const pageIds: PageIds = {}

  const pageArgs = (withForm = false): PageSeedArgs => ({
    media,
    pageIds,
    categoryIds,
    ...(withForm ? { form } : {}),
  })

  const pageContext = { disableRevalidate: true }

  payload.logger.info('— Seeding pages (VI)...')

  const createPage = async (slug: string, data: RequiredDataFromCollectionSlug<'pages'>) => {
    const doc = await payload.create({
      collection: 'pages',
      depth: 0,
      context: pageContext,
      data,
    })
    pageIds[slug] = doc.id
    return doc
  }

  // Order respects cross-page reference dependencies
  await createPage('quy-che', quyCheVi(pageArgs()))
  await createPage('he-thong', heThongVi(pageArgs()))
  await createPage('dao-tao', daoTaoVi(pageArgs()))
  await createPage('cong-bo-thong-tin', congBoThongTinVi(pageArgs()))
  await createPage('quan-tri-rui-ro', quanTriRuiRoVi(pageArgs()))
  await createPage('mo-hinh-ccp', moHinhCcpVi(pageArgs()))
  await createPage('lo-trinh', loTrinhVi(pageArgs()))
  await createPage('lien-he', lienHeVi(pageArgs(true)))
  await createPage('thanh-vien', thanhVienVi(pageArgs()))
  await createPage('gioi-thieu', gioiThieuVi(pageArgs()))
  const homePage = await createPage('home', homeVi(pageArgs()))

  payload.logger.info('— Seeding English page translations...')

  const updatePageEn = (id: number | string, data: RequiredDataFromCollectionSlug<'pages'>) =>
    payload.update({
      collection: 'pages',
      id,
      locale: 'en',
      context: pageContext,
      data: { ...data, _status: 'published' },
    })

  await Promise.all([
    updatePageEn(pageIds['quy-che'], quyCheEn(pageArgs())),
    updatePageEn(pageIds['he-thong'], heThongEn(pageArgs())),
    updatePageEn(pageIds['dao-tao'], daoTaoEn(pageArgs())),
    updatePageEn(pageIds['cong-bo-thong-tin'], congBoThongTinEn(pageArgs())),
    updatePageEn(pageIds['quan-tri-rui-ro'], quanTriRuiRoEn(pageArgs())),
    updatePageEn(pageIds['mo-hinh-ccp'], moHinhCcpEn(pageArgs())),
    updatePageEn(pageIds['lo-trinh'], loTrinhEn(pageArgs())),
    updatePageEn(pageIds['lien-he'], lienHeEn(pageArgs(true))),
    updatePageEn(pageIds['thanh-vien'], thanhVienEn(pageArgs())),
    updatePageEn(pageIds['gioi-thieu'], gioiThieuEn(pageArgs())),
    updatePageEn(homePage.id, homeEn(pageArgs())),
  ])

  payload.logger.info('— Seeding posts...')

  const postArgs = {
    heroImage: heroRisk,
    author: demoAuthor,
    categoryIds,
  }

  const postDocs: Post[] = []
  for (const def of POST_DEFINITIONS) {
    const doc = await payload.create({
      collection: 'posts',
      depth: 0,
      context: pageContext,
      data: buildPostVi(def, postArgs),
    })
    postDocs.push(doc)
  }

  payload.logger.info('— Seeding English post translations...')

  await Promise.all(
    POST_DEFINITIONS.map((def, i) =>
      payload.update({
        collection: 'posts',
        id: postDocs[i].id,
        locale: 'en',
        context: pageContext,
        data: { ...buildPostEn(def, postArgs), _status: 'published' },
      }),
    ),
  )

  payload.logger.info('— Setting related posts...')

  const relatedByCategory: Record<string, typeof postDocs> = {}
  POST_DEFINITIONS.forEach((def, i) => {
    if (!relatedByCategory[def.categoryKey]) relatedByCategory[def.categoryKey] = []
    relatedByCategory[def.categoryKey].push(postDocs[i])
  })

  await Promise.all(
    postDocs.map((doc, i) => {
      const def = POST_DEFINITIONS[i]
      const sameCategory = relatedByCategory[def.categoryKey].filter((p) => p.id !== doc.id)
      const related = sameCategory.slice(0, 2).map((p) => p.id)
      if (related.length === 0) return Promise.resolve()
      return payload.update({
        collection: 'posts',
        id: doc.id,
        context: pageContext,
        data: { relatedPosts: related },
      })
    }),
  )

  payload.logger.info('— Seeding globals...')

  // Do not pass disableRevalidate here — header/footer are read via unstable_cache on the
  // frontend and must trigger revalidateTag after seed (especially in production on OKE).
  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: headerNav(pageIds),
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: { ...footerNav(pageIds), ...footerContactVi() },
    }),
  ])

  await payload.updateGlobal({
    slug: 'footer',
    locale: 'en',
    data: footerContactEn(),
  })

  payload.logger.info('CCP website seeded successfully!')
}
