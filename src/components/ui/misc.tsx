import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Tone = 'neutral' | 'prussian' | 'sodium' | 'ok' | 'bad'

export function Meter({ value, className, tone = 'prussian' }: { value: number; className?: string; tone?: 'prussian' | 'sodium' | 'ok' }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  const color = tone === 'sodium' ? 'bg-sodium' : tone === 'ok' ? 'bg-ok' : 'bg-prussian'
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-panel-2', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: string
  title: string
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {children && <div className="mt-2 text-ink-2">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink-3">{icon}</div>}
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-ink-2">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

const TONES: Record<Tone, string> = {
  neutral: 'bg-panel-2 text-ink-2',
  prussian: 'bg-prussian-soft text-prussian',
  sodium: 'bg-sodium-soft text-sodium-strong',
  ok: 'bg-ok-soft text-ok',
  bad: 'bg-bad-soft text-bad',
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', TONES[tone])}>{children}</span>
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{children}</h2>
      {aside}
    </div>
  )
}
