import { cn } from '@/utils/cn'

export const CREDIT = { name: 'Prathiksha D', role: '1st year Engineering Student' }

/** Watermark-style credit shown at the foot of every page. */
export function CreditFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('no-print select-none px-4 pb-20 pt-10 text-center', className)}>
      {/* Watermark feel from size, spacing and rules; colour kept at 4.5:1 contrast or better so it stays readable. */}
      <p className="readout inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-2">
        <span aria-hidden className="h-px w-8 bg-line" />
        <span>
          Made by: <span className="font-semibold">{CREDIT.name}</span> ({CREDIT.role})
        </span>
        <span aria-hidden className="h-px w-8 bg-line" />
      </p>
    </footer>
  )
}
