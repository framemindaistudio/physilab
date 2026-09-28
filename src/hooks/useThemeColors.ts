import { useEffect, useRef } from 'react'

export interface ThemeColors {
  paper: string
  panel: string
  panel2: string
  canvas: string
  grid: string
  gridMajor: string
  ink: string
  ink2: string
  ink3: string
  line: string
  prussian: string
  sodium: string
  ok: string
  bad: string
  dark: boolean
}

function readColors(): ThemeColors {
  const cs = getComputedStyle(document.documentElement)
  const v = (n: string) => cs.getPropertyValue(n).trim()
  return {
    paper: v('--paper'),
    panel: v('--panel'),
    panel2: v('--panel-2'),
    canvas: v('--canvas-bg'),
    grid: v('--grid'),
    gridMajor: v('--grid-major'),
    ink: v('--ink'),
    ink2: v('--ink-2'),
    ink3: v('--ink-3'),
    line: v('--line'),
    prussian: v('--prussian'),
    sodium: v('--sodium'),
    ok: v('--ok'),
    bad: v('--bad'),
    dark: cs.colorScheme.includes('dark'),
  }
}

/**
 * Canvas drawings can't use CSS variables directly, so this resolves the theme tokens
 * and keeps a ref up to date when the theme (or the OS preference) changes.
 */
export function useThemeColors() {
  const ref = useRef<ThemeColors>(readColors())
  useEffect(() => {
    const refresh = () => {
      ref.current = readColors()
    }
    const mo = new MutationObserver(refresh)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', refresh)
    return () => {
      mo.disconnect()
      mq.removeEventListener('change', refresh)
    }
  }, [])
  return ref
}
