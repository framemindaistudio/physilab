import { Download, Trash2, X } from 'lucide-react'
import type { ExperimentModule, ObservationRow } from '@/types/experiment'
import { fixed } from '@/utils/format'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/misc'
import { selectRows } from './useAnalysis'

export function ObservationTable({
  module: m,
  rows,
  onRemove,
  onClear,
  compact = false,
}: {
  module: ExperimentModule
  rows: ObservationRow[]
  onRemove?: (id: string) => void
  onClear?: () => void
  compact?: boolean
}) {
  const { excluded } = selectRows(m, rows)
  const excludedIds = new Set(excluded.map((r) => r.id))
  const cols = m.observation.columns

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <caption className="sr-only">Observation table for {m.title}</caption>
          <thead>
            <tr className="bg-panel-2 text-left">
              <th scope="col" className="px-3 py-2 text-xs font-semibold text-ink-2">
                Trial
              </th>
              {cols.map((c) => (
                <th key={c.key} scope="col" className="px-3 py-2 text-right text-xs font-semibold text-ink-2">
                  {c.label}
                  {c.unit && <span className="ml-1 font-normal text-ink-3">({c.unit})</span>}
                </th>
              ))}
              {onRemove && <th className="w-10" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={cols.length + 2} className="px-3 py-8 text-center text-sm text-ink-3">
                  No readings yet. Set the controls and press “{m.observation.measureLabel}”.
                </td>
              </tr>
            )}
            {rows.map((r, i) => {
              const off = excludedIds.has(r.id)
              return (
                <tr key={r.id} className={cn('border-t border-line', off && 'text-ink-3')}>
                  <td className="readout px-3 py-1.5 text-ink-2">
                    {i + 1}
                    {off && !compact && <span className="ml-2 font-sans text-[11px] text-ink-3">not graphed</span>}
                  </td>
                  {cols.map((c) => {
                    const v = r.values[c.key]
                    return (
                      <td key={c.key} className="readout px-3 py-1.5 text-right">
                        {typeof v === 'number' ? fixed(v, c.decimals ?? 2) : String(v ?? '—')}
                      </td>
                    )
                  })}
                  {onRemove && (
                    <td className="px-1 text-right">
                      <button
                        type="button"
                        onClick={() => onRemove(r.id)}
                        className="rounded p-1 text-ink-3 hover:bg-panel-2 hover:text-bad"
                        aria-label={`Delete trial ${i + 1}`}
                      >
                        <X size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-[200px] flex-1 items-center gap-3">
            <Meter value={rows.length / m.observation.minTrials} tone={rows.length >= m.observation.minTrials ? 'ok' : 'sodium'} className="max-w-[160px]" />
            <span className="text-xs text-ink-2">
              {rows.length} of {m.observation.minTrials} readings needed
              {excluded.length > 0 && ` · ${excluded.length} taken under different settings (not graphed)`}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => exportCsv(m, rows)} disabled={!rows.length}>
              <Download size={14} /> Export CSV
            </Button>
            {onClear && (
              <Button
                size="sm"
                variant="danger"
                disabled={!rows.length}
                onClick={() => {
                  if (window.confirm(`Clear all ${rows.length} readings for ${m.title}? This cannot be undone.`)) onClear()
                }}
              >
                <Trash2 size={14} /> Clear table
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function exportCsv(m: ExperimentModule, rows: ObservationRow[]) {
  const cols = m.observation.columns
  const head = ['Trial', ...cols.map((c) => (c.unit ? `${c.label} (${c.unit})` : c.label))]
  const lines = rows.map((r, i) => [String(i + 1), ...cols.map((c) => String(r.values[c.key] ?? ''))])
  const csv = [head, ...lines].map((l) => l.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `physilab-${m.id}-observations.csv`
  a.click()
  URL.revokeObjectURL(url)
}
