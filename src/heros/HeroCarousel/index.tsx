'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { HeroItem } from '@/heros/types'

import { RenderHero } from '@/heros/RenderSingleHero'
import { cn } from '@/utilities/ui'

interface HeroCarouselProps {
  heroes: HeroItem[]
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ heroes }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const updateActiveIndex = useCallback(() => {
    const container = scrollRef.current
    if (!container) return

    const slideWidth = container.clientWidth
    if (slideWidth === 0) return

    const index = Math.round(container.scrollLeft / slideWidth)
    setActiveIndex(Math.min(Math.max(index, 0), heroes.length - 1))
  }, [heroes.length])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    container.addEventListener('scroll', updateActiveIndex, { passive: true })
    return () => container.removeEventListener('scroll', updateActiveIndex)
  }, [updateActiveIndex])

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current
    if (!container) return

    container.scrollTo({
      left: index * container.clientWidth,
      behavior: 'smooth',
    })
    setActiveIndex(index)
  }

  const goToPrevious = () => {
    scrollToIndex(activeIndex > 0 ? activeIndex - 1 : heroes.length - 1)
  }

  const goToNext = () => {
    scrollToIndex(activeIndex < heroes.length - 1 ? activeIndex + 1 : 0)
  }

  return (
    <div className="group relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {heroes.map((hero, index) => (
          <div
            key={hero.id || index}
            aria-hidden={index !== activeIndex}
            className="w-full shrink-0 snap-start snap-always"
          >
            <RenderHero {...hero} isActive={index === activeIndex} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Hero trước"
        className={cn(
          'absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border/50 bg-background/80 p-2 text-foreground shadow-sm backdrop-blur-sm transition-opacity hover:bg-accent md:flex',
          'opacity-70 group-hover:opacity-100 focus-visible:opacity-100',
        )}
        onClick={goToPrevious}
      >
        <ChevronLeft aria-hidden className="h-5 w-5" />
      </button>

      <button
        type="button"
        aria-label="Hero tiếp theo"
        className={cn(
          'absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border/50 bg-background/80 p-2 text-foreground shadow-sm backdrop-blur-sm transition-opacity hover:bg-accent md:flex',
          'opacity-70 group-hover:opacity-100 focus-visible:opacity-100',
        )}
        onClick={goToNext}
      >
        <ChevronRight aria-hidden className="h-5 w-5" />
      </button>

      <div
        aria-label="Chọn hero"
        className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2"
        role="tablist"
      >
        {heroes.map((hero, index) => (
          <button
            key={hero.id || index}
            type="button"
            role="tab"
            aria-label={`Hero ${index + 1}`}
            aria-selected={index === activeIndex}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              index === activeIndex ? 'bg-primary' : 'bg-primary/30 hover:bg-primary/50',
            )}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>
    </div>
  )
}
