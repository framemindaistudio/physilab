import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Info, Lightbulb, Sparkles, type LucideIcon } from 'lucide-react'
import type { ExperimentModule, Params } from '@/types/experiment'
import type { AdviceLevel } from '@/assistant/types'
import { adviseLab, seriesFor } from '@/assistant/labAssistant'
import { lab, useExperimentRecord, useLab } from '@/store/labStore'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const LEVEL: Record<AdviceLevel, { icon: LucideIcon; tone: string; label: string }> = {
  warn: { icon: AlertTriangle, tone: 'text-sodium-strong', label: 'Check' },
  tip: { icon: Lightbulb, tone: 'text-prussian', label: 'Tip' },
  info: { icon: Info, tone: 'text-ink-3', label: 'Note' },
  good: { icon: CheckCircle2, tone: 'text-ok', label: 'Good' },
}

const VISIBLE = 4

/** The rule-based Lab Assistant: live feedback on the student's readings and settings. */
export function LabAssistantPanel({
  module: m,
  where,
  params,
  onApply,
}: {
  module: ExperimentModule
  where: 'bench' | 'analysis'
  params: Params
  /** Apply suggested settings on the bench. */
  onApply?: (patch: Params) => void
}) {
  const record = useExperimentRecord(m.id)
  const { noise } = useLab()
  const [expanded, setExpanded] = useState(false)

  const advice = useMemo(() => {
    const s = seriesFor(m, record.rows, params, where)
    return adviseLab({
      module: m,
      rows: record.rows,
      used: s.used,
      excluded: s.excluded,
      analysis: s.analysis,
      params: s.params,
      noise,
      where,
      newSeries: s.newSeries,
    })
  }, [m, record.rows, params, noise, where])

  // Announce the top advice only after a reading is added or removed — not on every slider move.
  const [announcement, setAnnouncement] = useState('')
  const count = useRef(record.rows.length)
  useEffect(() => {
    if (count.current === record.rows.length) return
    count.current = record.rows.length
    if (advice[0]) setAnnouncement(`Lab Assistant: ${advice[0].title}`)
  }, [record.rows.length, advice])

  if (!advice.length) return null
  const shown = expanded ? advice : advice.slice(0, VISIBLE)

  return (
    <section data-guide="lab-assistant" aria-labelledby={`assistant-${m.id}-${where}`} className="panel p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={`assistant-${m.id}-${where}`} className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Sparkles size={16} className="text-sodium" aria-hidden />
          Lab Assistant
        </h2>
        <span className="text-xs text-ink-3">Rule-based checks on your readings</span>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <ul className="divide-y divide-line">
        {shown.map((a) => {
          const { icon: Icon, tone, label } = LEVEL[a.level]
          return (
            <li key={a.id} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
              <Icon size={16} className={cn('mt-0.5 shrink-0', tone)} aria-label={label} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{a.title}</p>
                {a.detail && <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{a.detail}</p>}
              </div>
              {a.action && (
                <div className="shrink-0 self-center">
                  {a.action.kind === 'link' && (
                    <Link to={a.action.to} className="text-sm font-medium text-prussian hover:underline">
                      {a.action.label}
                    </Link>
                  )}
                  {a.action.kind === 'setParams' && onApply && (
                    <Button size="sm" onClick={() => a.action?.kind === 'setParams' && onApply(a.action.params)}>
                      {a.action.label}
                    </Button>
                  )}
                  {a.action.kind === 'removeRow' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (a.action?.kind === 'removeRow' && window.confirm(`${a.action.label}? This cannot be undone.`)) lab.removeRow(m.id, a.action.rowId)
                      }}
                    >
                      {a.action.label}
                    </Button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {advice.length > VISIBLE && (
        <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-2 text-xs text-ink-3 hover:text-ink hover:underline">
          {expanded ? 'Show less' : `Show ${advice.length - VISIBLE} more`}
        </button>
      )}
    </section>
  )
}
