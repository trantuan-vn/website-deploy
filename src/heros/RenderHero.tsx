import React from 'react'

import type { Page } from '@/payload-types'

import { HeroCarousel } from '@/heros/HeroCarousel'
import { RenderHero } from '@/heros/RenderSingleHero'
import type { HeroItem } from '@/heros/types'

export const RenderHeroes: React.FC<{ heroes?: Page['heroes'] | null }> = ({ heroes: heroItems }) => {
  const validHeroes = (heroItems || []).filter(
    (hero): hero is HeroItem => Boolean(hero?.type && hero.type !== 'none'),
  )

  if (validHeroes.length === 0) return null

  if (validHeroes.length === 1) {
    return <RenderHero {...validHeroes[0]} />
  }

  return <HeroCarousel heroes={validHeroes} />
}
