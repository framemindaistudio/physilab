import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { EXPERIMENTS, getExperiment } from '@/experiments/registry'
import { useLabTimer } from '@/hooks/useLabTimer'
import { LabBench } from '@/components/experiment/LabBench'
import { ExperimentGlyph } from '@/components/experiment/ExperimentGlyph'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

/** Free-play bench: switch between apparatus without the guided sequence. */
export default function VirtualLab() {
  const { id } = useParams()
  const navigate = useNavigate()
  const m = getExperiment(id) ?? EXPERIMENTS[0]
  useLabTimer(m.id)

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Virtual Lab</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Open bench</h1>
          <p className="mt-2 max-w-2xl text-ink-2">
            Pick any apparatus and experiment freely. Readings you take here go into the same notebook as the guided experiment.
          </p>
        </div>
        <ButtonLink to={`/experiments/${m.id}/analysis`} variant="secondary" data-guide="vlab-analyse">
          Analyse {m.title} readings <ArrowRight size={14} />
        </ButtonLink>
      </header>

      <nav data-guide="vlab-picker" aria-label="Choose apparatus" className="mb-6 overflow-x-auto">
        <ul className="flex min-w-max gap-2">
          {EXPERIMENTS.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => navigate(`/lab/${e.id}`)}
                aria-current={e.id === m.id ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg border py-1.5 pl-1.5 pr-3.5 text-sm transition-colors',
                  e.id === m.id ? 'border-prussian bg-prussian-soft text-prussian' : 'border-line bg-panel text-ink-2 hover:border-ink-3',
                )}
              >
                <span className="rounded-md bg-[var(--canvas-bg)] p-0.5">
                  <ExperimentGlyph id={e.id} size={28} />
                </span>
                {e.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <LabBench key={m.id} module={m} />
    </div>
  )
}
