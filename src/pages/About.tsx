import { EXPERIMENTS } from '@/experiments/registry'
import { PageHeader } from '@/components/ui/misc'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/simulation/ParameterPanel'
import { CREDIT } from '@/components/layout/CreditFooter'
import { guides, useGuideState } from '@/guide/guideStore'
import { useState } from 'react'

const STACK = [
  ['Interface', 'React 19 + TypeScript, Vite, Tailwind CSS'],
  ['Simulation rendering', 'HTML Canvas (mechanics, induction, optics, photoelectric) and SVG (circuits)'],
  ['Numerics', 'Fourth-order Runge–Kutta, bisection, least-squares regression — written in plain TypeScript'],
  ['Graphs', 'Recharts'],
  ['Formulae', 'KaTeX'],
  ['Storage', 'Browser localStorage (Phase 1); schema ready for Supabase (Phase 2)'],
]

const CHAIN = ['Formula', 'Variables', 'Units', 'Physical constraints', 'Simulation model', 'Expected result']

export default function About() {
  const guideState = useGuideState()
  const [resetDone, setResetDone] = useState(false)

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="About" title="About PHYSILAB">
        Design and Development of an Interactive Virtual Physics Laboratory for Engineering Education.
        <span className="mt-1 block text-sm text-ink-3">
          Made by {CREDIT.name} ({CREDIT.role})
        </span>
      </PageHeader>

      <div className="space-y-10 text-ink-2">
        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-ink">What it is</h2>
          <p>
            PHYSILAB is a prototype virtual physics laboratory in which a student can perform several Engineering Physics
            experiments: set real experimental parameters, collect readings, see the physical phenomenon, plot graphs, calculate
            results, and test their understanding through viva questions. It is not a single-purpose model — it is a platform, and
            each experiment is a module plugged into the same structure.
          </p>
        </section>

        <section data-guide="about-chain">
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-ink">How each experiment is specified</h2>
          <p className="mb-4">Before anything is drawn on screen, every experiment is defined as a chain, and the animation, readings, graph and result all derive from the same model:</p>
          <ol className="flex flex-wrap items-center gap-2">
            {CHAIN.map((c, i) => (
              <li key={c} className="flex items-center gap-2">
                <span className="rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-ink">{c}</span>
                {i < CHAIN.length - 1 && <span className="text-ink-3">→</span>}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold tracking-tight text-ink">Models used</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-panel">
            {EXPERIMENTS.map((m) => (
              <li key={m.id} className="px-4 py-3">
                <p className="font-medium text-ink">
                  <span className="readout mr-2 text-ink-3">{m.number}</span>
                  {m.title}
                </p>
                <p className="mt-1 text-sm">{m.model.method}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-semibold tracking-tight text-ink">Technology</h2>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[200px_1fr]">
            {STACK.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-sm text-ink-3">{k}</dt>
                <dd className="text-sm text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-ink">Your data</h2>
          <p>
            Readings, viva scores and lab time are stored only in this browser’s local storage. Nothing is sent to a server.
            Clearing site data or using a different browser starts a fresh notebook.
          </p>
        </section>

        <section data-guide="about-guides" aria-labelledby="guides-heading">
          <h2 id="guides-heading" className="mb-3 font-display text-xl font-semibold tracking-tight text-ink">
            Guides
          </h2>
          <div className="panel divide-y divide-line">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <label htmlFor="guides-on" className="text-sm text-ink">
                Show a guide the first time I open each section
                <span className="block text-xs text-ink-3">You can always replay a page’s guide with the Page guide button.</span>
              </label>
              <Switch id="guides-on" checked={!guideState.off} onChange={(on) => guides.setOff(!on)} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
              <p className="text-sm text-ink">
                Reset guides
                <span className="block text-xs text-ink-3">Every section shows its guide again, starting with the welcome guide.</span>
              </p>
              <Button
                size="sm"
                onClick={() => {
                  guides.reset()
                  setResetDone(true)
                }}
              >
                Reset guides
              </Button>
            </div>
          </div>
          <p role="status" aria-live="polite" className="mt-2 min-h-[1.25rem] text-xs text-ok">
            {resetDone && !guideState.off && 'Guides reset. Each section will show its guide again the first time you open it.'}
          </p>
        </section>
      </div>
    </div>
  )
}
