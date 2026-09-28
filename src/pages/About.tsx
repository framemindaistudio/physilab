import { EXPERIMENTS } from '@/experiments/registry'
import { PageHeader } from '@/components/ui/misc'

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
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="About" title="About PHYSILAB">
        Design and Development of an Interactive Virtual Physics Laboratory for Engineering Education.
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

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-ink">How each experiment is specified</h2>
          <p className="mb-4">Before any code is drawn, every experiment is defined as a chain, and the animation, readings, graph and result all derive from the same model:</p>
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
      </div>
    </div>
  )
}
