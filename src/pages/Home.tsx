import { useMemo } from 'react'
import { ArrowRight, FlaskConical } from 'lucide-react'
import { EXPERIMENTS } from '@/experiments/registry'
import { CATEGORIES, PLANNED } from '@/data/categories'
import { timeOscillations } from '@/physics/mechanics/pendulum'
import { rad } from '@/physics/numerics'
import { ButtonLink } from '@/components/ui/Button'
import { Formula } from '@/components/ui/Formula'
import { PendulumWave } from '@/components/simulation/PendulumWave'
import { ExperimentCard } from '@/components/experiment/ExperimentCard'
import { fixed } from '@/utils/format'

const SEQUENCE = [
  { title: 'Aim & theory', body: 'Objective, derivation, variables and units — and a note on exactly how the simulation computes things.' },
  { title: 'Lab bench', body: 'Set real parameters on live apparatus and take readings with realistic instrument error.' },
  { title: 'Analysis', body: 'Readings become a least-squares graph; the result and its uncertainty come from the slope.' },
  { title: 'Viva', body: 'Eight questions with explanations, the way an examiner would ask them.' },
  { title: 'Report', body: 'A complete lab record — aim to conclusion — ready to save as PDF.' },
]

export default function Home() {
  // A real reading from the pendulum model, computed when the page loads.
  const proof = useMemo(() => {
    const L = 1.0
    const t10 = timeOscillations(L, 9.81, rad(5), 10)
    const T = t10 / 10
    return { L, t10, T, g: (4 * Math.PI * Math.PI * L) / (T * T) }
  }, [])

  return (
    <div>
      {/* Hero: the thesis is a working instrument, not a picture of one. */}
      <section className="graph-paper border-b border-line">
        <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:px-10 lg:py-20">
          <div className="min-w-0">
            <p className="eyebrow mb-4">Virtual Physics Laboratory · Engineering Physics</p>
            <h1 className="font-display text-[52px] font-extrabold leading-[0.9] tracking-[-0.035em] text-ink sm:text-[76px] lg:text-[60px] xl:text-[84px]">
              PHYSILAB
            </h1>
            <p className="mt-4 font-display text-2xl font-medium tracking-tight text-prussian sm:text-3xl">
              Physics. Simulated. <span className="text-sodium-strong">Understood.</span>
            </p>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-2">
              An interactive virtual laboratory for performing, analysing and understanding Engineering Physics experiments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/experiments" variant="primary" className="h-11 px-5">
                Explore Experiments <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink to="/lab" variant="secondary" className="h-11 px-5">
                <FlaskConical size={16} /> Enter Virtual Lab
              </ButtonLink>
            </div>
          </div>
          <figure className="panel overflow-hidden bg-[var(--canvas-bg)]/80 backdrop-blur-[1px]">
            <PendulumWave className="block h-[340px] w-full sm:h-[420px]" />
            <figcaption className="border-t border-line px-4 py-2.5 text-xs text-ink-3">
              Fifteen pendulums whose lengths make them complete 20, 21 … 34 swings in the same 60 seconds. The pattern is the period law, running live.
            </figcaption>
          </figure>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] space-y-20 px-4 py-16 sm:px-6 lg:px-10">
        {/* The experiments */}
        <section aria-labelledby="bench-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow mb-2">On the bench now</p>
              <h2 id="bench-heading" className="font-display text-3xl font-bold tracking-tight">
                Six experiments, six kinds of physics
              </h2>
            </div>
            <ButtonLink to="/experiments" variant="ghost">
              Full catalogue <ArrowRight size={14} />
            </ButtonLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERIMENTS.map((m) => (
              <ExperimentCard key={m.id} module={m} />
            ))}
          </div>
        </section>

        {/* The sequence every experiment follows */}
        <section aria-labelledby="sequence-heading" className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div>
            <p className="eyebrow mb-2">One structure</p>
            <h2 id="sequence-heading" className="font-display text-3xl font-bold tracking-tight">
              Every experiment runs the same way
            </h2>
            <p className="mt-3 text-ink-2">
              The same five stages, in the same order, whether you are timing a pendulum or measuring Planck’s constant.
            </p>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-5">
            {SEQUENCE.map((s, i) => (
              <li key={s.title} className="bg-panel p-5">
                <span className="readout text-sm text-sodium-strong">{String(i + 1).padStart(2, '0')}</span>
                <p className="mt-2 font-display text-lg font-semibold tracking-tight">{s.title}</p>
                <p className="mt-1.5 text-sm text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* The rule */}
        <section aria-labelledby="rule-heading" className="panel grid gap-8 p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-2">The rule behind every simulation</p>
            <h2 id="rule-heading" className="font-display text-3xl font-bold tracking-tight">
              Nothing on screen is made up
            </h2>
            <p className="mt-4 text-ink-2">
              The animation, the readings, the graph and the result all come from one physics model per experiment. The pendulum is
              not animated and then given a textbook period: its equation of motion is integrated, and a reading is taken by counting
              swings — exactly as you would with a stopwatch.
            </p>
            <p className="mt-3 text-ink-2">
              Each experiment documents its equations, assumptions and numerical method, so every number can be defended in a viva.
            </p>
          </div>
          <div className="graph-paper rounded-lg border border-line p-5">
            <p className="eyebrow mb-3">Computed on this page load</p>
            <div className="space-y-2 text-ink">
              <Formula tex={`\\ddot\\theta = -\\tfrac{g}{L}\\sin\\theta,\\quad L = ${fixed(proof.L, 2)}\\,\\mathrm m,\\ \\theta_0 = 5^\\circ`} block />
              <Formula tex={`t_{10} = ${fixed(proof.t10, 4)}\\,\\mathrm s \\;\\Rightarrow\\; T = ${fixed(proof.T, 5)}\\,\\mathrm s`} block />
              <Formula tex={`g = \\frac{4\\pi^2 L}{T^2} = ${fixed(proof.g, 3)}\\,\\mathrm{m\\,s^{-2}}`} block />
            </div>
            <p className="mt-3 text-xs text-ink-3">
              Slightly below 9.81 because a 5° swing is not quite simple harmonic — the model keeps that real effect.
            </p>
          </div>
        </section>

        {/* Categories and roadmap */}
        <section aria-labelledby="cat-heading">
          <p className="eyebrow mb-2">The whole syllabus</p>
          <h2 id="cat-heading" className="mb-6 font-display text-3xl font-bold tracking-tight">
            Six areas of Engineering Physics
          </h2>
          <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => {
              const live = EXPERIMENTS.filter((e) => e.category === c.id).length
              const planned = PLANNED.filter((p) => p.category === c.id).length
              return (
                <div key={c.id} className="bg-panel p-5">
                  <p className="font-display text-lg font-semibold tracking-tight">{c.label}</p>
                  <p className="mt-1 text-sm text-ink-2">{c.blurb}</p>
                  <p className="readout mt-3 text-xs text-ink-3">
                    <span className={live ? 'text-ok' : ''}>{live} live</span> · {planned} planned
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-ink-3 sm:px-6 lg:px-10">
          <span>PHYSILAB — Design and Development of an Interactive Virtual Physics Laboratory for Engineering Education</span>
          <span>Progress is saved in this browser.</span>
        </div>
      </footer>
    </div>
  )
}
