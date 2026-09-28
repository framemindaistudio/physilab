import type { Params, Row } from '@/types/experiment'

/** Read a numeric cell from an observation row. */
export const num = (row: Row, key: string) => Number(row[key])

/** Read a numeric parameter. */
export const p = (params: Params, key: string) => Number(params[key])

/** Apply instrument error only when the student has it switched on. */
export function withNoise(value: number, sigma: number, noise: boolean, gauss: () => number): number {
  return noise ? value + sigma * gauss() : value
}

export function mostCommon(values: string[]): string {
  const counts = new Map<string, number>()
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1))
  let best = values[0]
  let n = 0
  counts.forEach((c, v) => {
    if (c > n) {
      best = v
      n = c
    }
  })
  return best
}
