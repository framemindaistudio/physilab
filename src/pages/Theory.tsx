import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { EXPERIMENTS } from '@/experiments/registry'
import { categoryLabel } from '@/data/categories'
import { Formula } from '@/components/ui/Formula'
import { PageHeader } from '@/components/ui/misc'

/** A formula sheet across every experiment, searchable. */
export default function Theory() {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const items = useMemo(
    () =>
      EXPERIMENTS.map((m) => ({
        m,
        sections: m.theory.filter(
          (s) => !needle || `${m.title} ${s.heading} ${s.body.join(' ')} ${(s.formulas ?? []).map((f) => f.caption).join(' ')}`.toLowerCase().includes(needle),
        ),
      })).filter((x) => x.sections.length),
    [needle],
  )

  return (
    <div>
      <PageHeader eyebrow="Theory" title="Formula sheet & theory">
        The theory behind every experiment in one place. Each formula here is the one the simulation actually computes.
      </PageHeader>

      <div className="relative mb-8 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search: flux, fringe, stopping potential…"
          aria-label="Search theory"
          className="h-10 w-full rounded-lg border border-line bg-panel pl-9 pr-3 text-sm"
        />
      </div>

      {items.length === 0 && <p className="text-sm text-ink-2">Nothing matches “{q}”. Try a quantity such as “period” or “wavelength”.</p>}

      <div className="space-y-12">
        {items.map(({ m, sections }) => (
          <section key={m.id} aria-labelledby={`th-${m.id}`}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
              <h2 id={`th-${m.id}`} className="font-display text-2xl font-bold tracking-tight">
                <span className="readout mr-3 text-base font-normal text-ink-3">{m.number}</span>
                {m.title}
              </h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ink-3">{categoryLabel(m.category)}</span>
                <Link to={`/experiments/${m.id}`} className="text-prussian hover:underline">
                  Open experiment
                </Link>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {sections.map((s) => (
                <article key={s.heading} className="panel p-5">
                  <h3 className="font-display text-lg font-semibold tracking-tight">{s.heading}</h3>
                  <p className="mt-2 text-sm text-ink-2">{s.body[0]}</p>
                  {s.formulas && (
                    <div className="mt-3 space-y-2">
                      {s.formulas.map((f) => (
                        <div key={f.tex} className="rounded-md bg-[var(--canvas-bg)] px-3 py-2">
                          <Formula tex={f.tex} block />
                          {f.caption && <p className="text-center text-xs text-ink-3">{f.caption}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
