import type { ResultItem } from '@/types/experiment'
import { Formula } from '@/components/ui/Formula'
import { fixed, sig } from '@/utils/format'
import { percentError } from '@/utils/stats'
import { cn } from '@/utils/cn'

export function ResultCard({ r }: { r: ResultItem }) {
  const d = r.decimals ?? 3
  const err = r.accepted !== undefined && Number.isFinite(r.value) ? percentError(r.value, r.accepted) : undefined
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <p className="text-xs text-ink-3">{r.label}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className="text-ink">
          <Formula tex={r.symbol} />
        </span>
        <span className="text-ink-3">=</span>
        <span className="readout text-xl font-semibold text-ink">{Number.isFinite(r.value) ? fixed(r.value, d) : '—'}</span>
        {r.uncertainty !== undefined && Number.isFinite(r.uncertainty) && (
          <span className="readout text-sm text-ink-2">± {sig(r.uncertainty, 2)}</span>
        )}
        <span className="text-sm text-ink-2">{r.unit}</span>
      </p>
      {r.accepted !== undefined && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-3">
          <span>
            {r.acceptedLabel ?? 'Accepted'}: <span className="readout text-ink-2">{fixed(r.accepted, d)}</span>
          </span>
          {err !== undefined && (
            <span className={cn('readout rounded px-1.5 py-0.5', err < 2 ? 'bg-ok-soft text-ok' : err < 5 ? 'bg-sodium-soft text-sodium-strong' : 'bg-bad-soft text-bad')}>
              {fixed(err, 2)}% error
            </span>
          )}
        </p>
      )}
    </div>
  )
}
