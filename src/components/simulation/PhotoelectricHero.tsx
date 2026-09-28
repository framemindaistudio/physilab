import { Suspense, useEffect, useRef, useState } from 'react'
import { photoelectric } from '@/experiments/photoelectric'
import { thresholdWavelength, METALS } from '@/physics/modern/photoelectric'

const METAL = 'sodium'
const LAMBDA_MIN = 250
const LAMBDA_MAX = 600
const STEP_NM = 1.5
const TICK_MS = 90

/**
 * Home-page demonstration: the real photoelectric apparatus with the light swept from
 * ultraviolet to orange. Emission stops at the sodium threshold (≈525 nm) however bright
 * the light is — the photon picture, running live on the same model as the experiment.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export function PhotoelectricHero({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion()
  const [lambda, setLambda] = useState(365)
  const sweep = useRef({ lambda: 365, dir: 1 })

  // Sweep the wavelength back and forth between UV and orange.
  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => {
      const s = sweep.current
      let next = s.lambda + s.dir * STEP_NM
      if (next >= LAMBDA_MAX) {
        next = LAMBDA_MAX
        s.dir = -1
      } else if (next <= LAMBDA_MIN) {
        next = LAMBDA_MIN
        s.dir = 1
      }
      s.lambda = next
      setLambda(next)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [reduced])

  const Apparatus = photoelectric.Apparatus
  const params = { wavelength: Math.round(lambda), intensity: 80, metal: METAL, voltage: 1 }
  const threshold = Math.round(thresholdWavelength(METALS[METAL].phi))

  return (
    <div className={className}>
      <Suspense fallback={<div className="grid h-[440px] place-items-center text-sm text-ink-3">Setting up apparatus…</div>}>
        <Apparatus params={params} running={!reduced} speed={1} resetKey={0} />
      </Suspense>
      <p className="sr-only" aria-live="off">
        Light of {Math.round(lambda)} nanometres on a sodium cathode. Electrons are emitted only below {threshold} nanometres.
      </p>
    </div>
  )
}
