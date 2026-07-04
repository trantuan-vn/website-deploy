import type { Page } from '@/payload-types'

export type HeroItem = NonNullable<Page['heroes']>[number]
