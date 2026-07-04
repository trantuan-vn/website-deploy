import type { LexicalRoot } from './lexical'
import { lexicalRoot } from './lexical'
import type { PageIds, CategoryIds } from './types'

type ContentSize = 'full' | 'half' | 'oneThird' | 'twoThirds'

type ColumnLink =
  | {
      type: 'reference'
      pageKey: string
      label: string
      pageIds: PageIds
    }
  | {
      type: 'custom'
      url: string
      label: string
      newTab?: boolean
    }

export function contentColumn(
  size: ContentSize,
  richText: LexicalRoot,
  linkConfig?: ColumnLink,
) {
  const col: Record<string, unknown> = {
    size,
    richText,
    enableLink: Boolean(linkConfig),
  }

  if (linkConfig) {
    if (linkConfig.type === 'reference') {
      col.link = {
        type: 'reference' as const,
        reference: {
          relationTo: 'pages' as const,
          value: String(linkConfig.pageIds[linkConfig.pageKey]),
        },
        label: linkConfig.label,
        newTab: false,
      }
    } else {
      col.link = {
        type: 'custom' as const,
        url: linkConfig.url,
        label: linkConfig.label,
        newTab: linkConfig.newTab ?? false,
      }
    }
  } else {
    col.enableLink = false
  }

  return col
}

export function contentBlock(...columns: ReturnType<typeof contentColumn>[]) {
  return {
    blockType: 'content' as const,
    columns,
  }
}

export function archiveBlock(args: {
  categoryKeys: string[]
  categoryIds: CategoryIds
  limit?: number
  introContent: LexicalRoot
}) {
  return {
    blockType: 'archive' as const,
    populateBy: 'collection' as const,
    relationTo: 'posts' as const,
    categories: args.categoryKeys.map((key) => String(args.categoryIds[key])),
    limit: args.limit ?? 5,
    introContent: args.introContent,
  }
}

export function mediaBlock(mediaId: number | string) {
  return {
    blockType: 'mediaBlock' as const,
    media: String(mediaId),
  }
}

type CtaLink =
  | {
      type: 'reference'
      pageKey: string
      label: string
      pageIds: PageIds
      appearance?: 'default' | 'outline'
    }
  | {
      type: 'custom'
      url: string
      label: string
      newTab?: boolean
      appearance?: 'default' | 'outline'
    }

export function ctaBlock(richText: LexicalRoot, links: CtaLink[]) {
  return {
    blockType: 'cta' as const,
    richText,
    links: links.map((l) => {
      if (l.type === 'reference') {
        return {
          link: {
            type: 'reference' as const,
            reference: {
              relationTo: 'pages' as const,
              value: String(l.pageIds[l.pageKey]),
            },
            label: l.label,
            appearance: l.appearance ?? ('default' as const),
          },
        }
      }
      return {
        link: {
          type: 'custom' as const,
          url: l.url,
          label: l.label,
          newTab: l.newTab ?? false,
          appearance: l.appearance ?? ('default' as const),
        },
      }
    }),
  }
}

export function formBlock(formId: number | string, introContent: LexicalRoot) {
  return {
    blockType: 'formBlock' as const,
    enableIntro: true,
    form: String(formId),
    introContent,
  }
}

export function heroLinkCustom(
  label: string,
  url: string,
  appearance: 'default' | 'outline' = 'default',
  newTab = false,
) {
  return {
    link: {
      type: 'custom' as const,
      label,
      url,
      appearance,
      newTab,
    },
  }
}

export function heroLinkReference(
  label: string,
  pageId: number | string,
  appearance: 'default' | 'outline' = 'default',
) {
  return {
    link: {
      type: 'reference' as const,
      label,
      reference: { relationTo: 'pages' as const, value: String(pageId) },
      appearance,
    },
  }
}

export { lexicalRoot }
