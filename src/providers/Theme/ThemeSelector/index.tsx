'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Monitor, Moon, Sun } from 'lucide-react'
import React, { useState } from 'react'

import type { Theme } from './types'

import { useTheme } from '..'
import { themeLocalStorageKey } from './types'

const themeIcons = {
  auto: Monitor,
  light: Sun,
  dark: Moon,
} as const

export const ThemeSelector: React.FC = () => {
  const { setTheme } = useTheme()
  const [value, setValue] = useState<Theme | 'auto'>('auto')

  const onThemeChange = (themeToSet: Theme | 'auto') => {
    if (themeToSet === 'auto') {
      setTheme(null)
      setValue('auto')
    } else {
      setTheme(themeToSet)
      setValue(themeToSet)
    }
  }

  React.useEffect(() => {
    const preference = window.localStorage.getItem(themeLocalStorageKey) as Theme | 'auto' | null
    setValue(preference ?? 'auto')
  }, [])

  const Icon = themeIcons[value] ?? Monitor

  return (
    <Select onValueChange={onThemeChange} value={value}>
      <SelectTrigger
        aria-label="Select a theme"
        className="w-9 h-9 p-0 border-none bg-transparent hover:bg-accent/50 rounded-md flex items-center justify-center [&>svg:last-child]:hidden"
      >
        <Icon className="w-5 h-5 text-primary" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="auto">
          <span className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Auto
          </span>
        </SelectItem>
        <SelectItem value="light">
          <span className="flex items-center gap-2">
            <Sun className="w-4 h-4" />
            Light
          </span>
        </SelectItem>
        <SelectItem value="dark">
          <span className="flex items-center gap-2">
            <Moon className="w-4 h-4" />
            Dark
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
