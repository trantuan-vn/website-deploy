import React from 'react'

import { HighImpactHero } from '@/heros/HighImpact'
import { LowImpactHero } from '@/heros/LowImpact'
import { MediumImpactHero } from '@/heros/MediumImpact'
import type { HeroItem } from '@/heros/types'

const heroComponents = {
  highImpact: HighImpactHero,
  lowImpact: LowImpactHero,
  mediumImpact: MediumImpactHero,
}

interface RenderHeroProps extends HeroItem {
  isActive?: boolean
}

export const RenderHero: React.FC<RenderHeroProps> = ({ isActive = true, type, ...props }) => {
  if (!type || type === 'none') return null

  const HeroToRender = heroComponents[type]

  if (!HeroToRender) return null

  return <HeroToRender isActive={isActive} type={type} {...props} />
}
