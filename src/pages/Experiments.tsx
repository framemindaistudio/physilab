import { useState } from 'react'
import { EXPERIMENTS } from '@/experiments/registry'
import { CATEGORIES, PLANNED } from '@/data/categories'
import { SYLLABUS } from '@/data/syllabus'
import type { CategoryId } from '@/types/experiment'
import { ExperimentCard } from '@/components/experiment/ExperimentCard'
import { PageHeader, Tag } from '@/components/ui/misc'
import { cn } from '@/utils/cn'

export default function Experiments() {
  const [filter, setFilter] = useState<CategoryId | 'all' | 'syllabus'>('all')
  const list =
    filter === 'syllabus'
      ? SYLLABUS.ids.map((id) => EXPERIMENTS.find((e) => e.id === id)).filter((e): e is (typeof EXPERIMENTS)[number] => !!e)
      : EXPERIMENTS.filter((e) => filter === 'all' || e.category === filter)
  const planned = filter === 'syllabus' ? [] : PLANNED.filter((p) => filter === 'all' || p.category === filter)

  return (
    <div>
      <PageHeader eyebrow="Catalogue" title="Experiments">
        Each experiment follows the same sequence: aim and theory, lab bench, analysis, viva and report.
      </PageHeader>

      <div data-guide="exp-filters" className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter by area">
        {[{ id: 'all' as const, label: `All ${EXPERIMENTS.length}` }, { id: 'syllabus' as const, label: `${SYLLABUS.code} lab (${SYLLABUS.ids.length})` }, ...CATEGORIES].map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              filter === c.id ? 'border-prussian bg-prussian text-[var(--paper)]' : 'border-line bg-panel text-ink-2 hover:border-ink-3',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {list.length > 0 ? (
        <div data-guide="exp-grid" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => (
            <ExperimentCard key={m.id} module={m} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-2">
          No experiments in this area are live yet. The planned ones are listed below.
        </p>
      )}

      {planned.length > 0 && (
        <section data-guide="exp-planned" className="mt-14" aria-labelledby="planned-heading">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="planned-heading" className="font-display text-xl font-semibold tracking-tight">
              Planned for the next phases
            </h2>
            <span className="text-xs text-ink-3">Built on the same experiment module contract</span>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {planned.map((p) => (
              <li key={p.title} className="flex items-center justify-between gap-3 bg-panel px-4 py-3">
                <span className="text-sm text-ink-2">{p.title}</span>
                <Tag>{CATEGORIES.find((c) => c.id === p.category)?.label.split(' ')[0]}</Tag>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
