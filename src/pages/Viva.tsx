import { GraduationCap } from 'lucide-react'
import { EXPERIMENTS } from '@/experiments/registry'
import { useLab } from '@/store/labStore'
import { bestViva } from '@/store/progress'
import { categoryLabel } from '@/data/categories'
import { ButtonLink } from '@/components/ui/Button'
import { Meter, PageHeader } from '@/components/ui/misc'
import { ExperimentGlyph } from '@/components/experiment/ExperimentGlyph'

export default function Viva() {
  const state = useLab()
  const totalQ = EXPERIMENTS.reduce((s, m) => s + m.viva.length, 0)

  return (
    <div>
      <PageHeader eyebrow="Viva" title="Viva voce practice">
        {totalQ} questions across {EXPERIMENTS.length} experiments, each with an explanation. Your best score for each set is kept.
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {EXPERIMENTS.map((m) => {
          const r = state.experiments[m.id]
          const best = r ? bestViva(r) : undefined
          return (
            <article key={m.id} className="panel flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <ExperimentGlyph id={m.id} size={40} />
                <span className="readout text-xs text-ink-3">{m.viva.length} questions</span>
              </div>
              <p className="eyebrow mt-3">{categoryLabel(m.category)}</p>
              <h2 className="font-display text-lg font-semibold tracking-tight">{m.title}</h2>
              <div className="mt-4 flex items-center gap-3">
                <Meter value={best ?? 0} tone={best !== undefined && best >= 0.7 ? 'ok' : 'sodium'} />
                <span className="readout shrink-0 text-xs text-ink-2">{best === undefined ? 'not taken' : `best ${Math.round(best * 100)}%`}</span>
              </div>
              <ButtonLink to={`/experiments/${m.id}/viva`} variant={best === undefined ? 'primary' : 'secondary'} className="mt-5 self-start" size="sm">
                <GraduationCap size={14} /> {best === undefined ? 'Start viva' : 'Retake viva'}
              </ButtonLink>
            </article>
          )
        })}
      </div>
    </div>
  )
}
