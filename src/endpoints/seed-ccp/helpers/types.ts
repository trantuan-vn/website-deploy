import type { Category, Form, Media, User } from '@/payload-types'

export type PageIds = Record<string, number | string>
export type CategoryIds = Record<string, number | string>

export type SeedMedia = {
  heroHome: Media
  heroHome2: Media
  heroHome3: Media
  heroAbout: Media
  heroModel: Media
  heroRisk: Media
  heroPost: Media
  heroRoadmap: Media
  metaDefault: Media
}

export type PageSeedArgs = {
  media: SeedMedia
  pageIds: PageIds
  categoryIds: CategoryIds
  form?: Form
}

export type PostSeedArgs = {
  heroImage: Media
  author: User
  categoryIds: CategoryIds
}
