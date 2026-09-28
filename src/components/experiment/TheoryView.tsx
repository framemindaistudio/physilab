import { Cpu } from 'lucide-react'
import type { ExperimentModule } from '@/types/experiment'
import { Formula } from '@/components/ui/Formula'
import { SectionTitle, Tag } from '@/components/ui/misc'

const ROLE_TONE = {
  independent: 'prussian',
  dependent: 'sodium',
  controlled: 'neutral',
  constant: 'neutral',
} as const

export function TheoryView({ module: m }: { module: ExperimentModule }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section data-guide="theory-aim" className="panel p-5 sm:p-6">
          <p className="eyebrow mb-2">Aim</p>
          <p className="text-[17px] leading-relaxed text-ink">{m.aim}</p>
          <p className="eyebrow mb-2 mt-6">Objectives</p>
          <ul className="space-y-1.5">
            {m.objectives.map((o) => (
              <li key={o} className="flex gap-2.5 text-ink-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-prussian" aria-hidden />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </section>

        {m.theory.map((s, i) => (
          <section key={s.heading} data-guide={i === 0 ? 'theory-section' : undefined} className="panel p-5 sm:p-6">
            <SectionTitle>{s.heading}</SectionTitle>
            <div className="prose-lab max-w-[68ch] text-ink-2">
              {s.body.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
            {s.formulas && (
              <div className="mt-4 grid gap-3">
                {s.formulas.map((f) => (
                  <figure key={f.tex} className="rounded-lg border border-line bg-[var(--canvas-bg)] px-4 py-3">
                    <Formula tex={f.tex} block />
                    {f.caption && <figcaption className="mt-1 text-center text-xs text-ink-3">{f.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            )}
          </section>
        ))}

        <section className="panel p-5 sm:p-6">
          <SectionTitle>Procedure</SectionTitle>
          <ol className="space-y-2.5">
            {m.procedure.map((step, i) => (
              <li key={step} className="flex gap-3 text-ink-2">
                <span className="readout mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-xs text-ink">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="eyebrow mb-2 mt-6">Precautions</p>
          <ul className="space-y-1.5">
            {m.precautions.map((p) => (
              <li key={p} className="flex gap-2.5 text-sm text-ink-2">
                <span className="mt-2 h-1 w-3 shrink-0 bg-sodium" aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="space-y-6">
        <section data-guide="theory-variables" className="panel p-5">
          <p className="eyebrow mb-3">Variables</p>
          <ul className="space-y-2.5">
            {m.variables.map((v) => (
              <li key={v.symbol} className="flex items-start justify-between gap-3">
                <div className="flex gap-2.5">
                  <span className="w-10 shrink-0 text-ink">
                    <Formula tex={v.symbol} />
                  </span>
                  <span className="text-sm text-ink-2">
                    {v.name}
                    <span className="block text-xs text-ink-3">{v.unit}</span>
                  </span>
                </div>
                <Tag tone={ROLE_TONE[v.role]}>{v.role}</Tag>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel p-5">
          <p className="eyebrow mb-3">Apparatus</p>
          <ul className="space-y-1.5 text-sm text-ink-2">
            {m.apparatusList.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
        <section data-guide="theory-model" className="rounded-[10px] border border-prussian/30 bg-prussian-soft/60 p-5">
          <div className="mb-3 flex items-center gap-2 text-prussian">
            <Cpu size={16} />
            <p className="text-sm font-semibold">How this simulation is built</p>
          </div>
          <div className="space-y-2">
            {m.model.equations.map((e) => (
              <div key={e.tex}>
                <Formula tex={e.tex} block className="text-[0.92em]" />
                <p className="text-xs text-ink-3">{e.caption}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-2">{m.model.method}</p>
          <p className="eyebrow mb-1.5 mt-4">Assumptions</p>
          <ul className="list-disc space-y-1 pl-4 text-xs text-ink-2">
            {m.model.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}
