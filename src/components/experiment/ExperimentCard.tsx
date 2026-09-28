import { Link } from 'react-router-dom'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import type { ExperimentModule } from '@/types/experiment'
import { useExperimentRecord } from '@/store/labStore'
import { isCompleted, stageFraction } from '@/store/progress'
import { categoryLabel } from '@/data/categories'
import { Meter } from '@/components/ui/misc'
import { ExperimentGlyph } from './ExperimentGlyph'

export function ExperimentCard({ module: m }: { module: ExperimentModule }) {
  const record = useExperimentRecord(m.id)
  const frac = stageFraction(m, record)
  const done = isCompleted(m, record)
  return (
    <Link
      to={`/experiments/${m.id}`}
      className="group panel flex flex-col p-5 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-prussian/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-lg border border-line bg-[var(--canvas-bg)] p-1.5">
          <ExperimentGlyph id={m.id} size={48} />
        </div>
        <span className="readout text-sm text-ink-3">{m.number}</span>
      </div>
      <p className="eyebrow mt-4">{categoryLabel(m.category)}</p>
      <h3 className="mt-1 flex items-center gap-1.5 font-display text-xl font-semibold tracking-tight text-ink">
        {m.title}
        <ArrowUpRight size={16} className="text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </h3>
      <p className="mt-1.5 flex-1 text-sm text-ink-2">{m.tagline}</p>
      <div className="mt-4 flex items-center gap-3">
        <Meter value={frac} tone={done ? 'ok' : 'prussian'} />
        {done ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-ok">
            <CheckCircle2 size={13} /> Done
          </span>
        ) : (
          <span className="readout shrink-0 text-xs text-ink-3">{Math.round(frac * 100)}%</span>
        )}
      </div>
    </Link>
  )
}
