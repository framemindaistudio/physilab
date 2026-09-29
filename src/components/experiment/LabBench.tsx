import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Crosshair, Pause, Play, RotateCcw } from 'lucide-react'
import type { ExperimentModule, Params } from '@/types/experiment'
import { lab, useExperimentRecord, useLab } from '@/store/labStore'
import { gauss } from '@/utils/random'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { ParameterPanel, Switch } from '@/components/simulation/ParameterPanel'
import { ObservationTable } from './ObservationTable'
import { LabAssistantPanel } from '@/components/assistant/LabAssistantPanel'

const SPEEDS = [0.1, 0.25, 0.5, 1, 2]

export function defaultParams(m: ExperimentModule): Params {
  return Object.fromEntries(m.parameters.map((d) => [d.key, d.default]))
}

/**
 * The bench: live apparatus, controls, readouts, and the observation table.
 * Used both inside an experiment and in the free-play Virtual Lab.
 */
export function LabBench({ module: m, showTable = true }: { module: ExperimentModule; showTable?: boolean }) {
  const record = useExperimentRecord(m.id)
  const { noise } = useLab()
  const [params, setParams] = useState<Params>(() => ({ ...defaultParams(m), ...(record.params ?? {}) }))
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(m.id === 'faraday' ? 0.25 : 1)
  const [resetKey, setResetKey] = useState(0)
  const [status, setStatus] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)

  // Persist the bench settings so the student comes back to the same setup.
  const saveTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => lab.saveParams(m.id, params), 400)
    return () => window.clearTimeout(saveTimer.current)
  }, [m.id, params])

  const readouts = useMemo(() => m.readouts(params), [m, params])
  const Apparatus = m.Apparatus

  const change = (key: string, value: number | string | boolean) => {
    setParams((prev) => ({ ...prev, [key]: value }))
    setStatus(null)
  }

  const measure = () => {
    const res = m.observation.measure(params, { noise, gauss })
    if (res.ok) {
      lab.addRow(m.id, res.row)
      setStatus({ tone: 'ok', text: `Trial ${record.rows.length + 1} recorded.` })
    } else {
      setStatus({ tone: 'bad', text: res.error })
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_272px] xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Apparatus */}
        <section data-guide="bench-apparatus" className="panel overflow-hidden" aria-label="Virtual apparatus">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <p className="eyebrow">Virtual apparatus</p>
            <div data-guide="bench-controls" className="flex items-center gap-2">
              <Button size="sm" variant={running ? 'secondary' : 'primary'} onClick={() => setRunning((r) => !r)}>
                {running ? <Pause size={14} /> : <Play size={14} />}
                {running ? 'Pause' : 'Start'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setResetKey((k) => k + 1)
                  setRunning(false)
                }}
              >
                <RotateCcw size={14} /> Reset
              </Button>
              <label className="sr-only" htmlFor={`speed-${m.id}`}>
                Playback speed
              </label>
              <select
                id={`speed-${m.id}`}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="readout h-8 rounded-lg border border-line bg-panel px-2 text-xs text-ink"
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}×
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-[var(--canvas-bg)]">
            <Suspense fallback={<div className="grid h-[400px] place-items-center text-sm text-ink-3">Setting up apparatus…</div>}>
              <Apparatus params={params} running={running} speed={speed} resetKey={resetKey} onStop={() => setRunning(false)} />
            </Suspense>
          </div>
        </section>

        {/* Controls */}
        <aside data-guide="bench-params" className="panel flex flex-col" aria-label="Parameters">
          <div className="border-b border-line px-4 py-2.5">
            <p className="eyebrow">Parameters</p>
          </div>
          <div className="flex-1 px-4 py-4">
            <ParameterPanel defs={m.parameters} params={params} onChange={change} />
          </div>
          <div className="space-y-3 border-t border-line px-4 py-4">
            <div data-guide="bench-noise" className="flex items-center justify-between gap-3">
              <label htmlFor={`noise-${m.id}`} className="text-[13px] text-ink-2">
                Instrument error
                <span className="block text-xs text-ink-3">Reaction time, least count, meter noise</span>
              </label>
              <Switch id={`noise-${m.id}`} checked={noise} onChange={(v) => lab.setNoise(v)} />
            </div>
            {showTable && (
              <Button variant="measure" className="w-full" onClick={measure} data-guide="bench-measure">
                <Crosshair size={16} /> {m.observation.measureLabel}
              </Button>
            )}
            <p role="status" aria-live="polite" className={cn('min-h-[1.25rem] text-xs', status?.tone === 'bad' ? 'text-bad' : 'text-ok')}>
              {status?.text}
            </p>
            <button
              type="button"
              className="text-xs text-ink-3 underline-offset-2 hover:text-ink hover:underline"
              onClick={() => {
                setParams(defaultParams(m))
                setResetKey((k) => k + 1)
              }}
            >
              Restore default settings
            </button>
          </div>
        </aside>
      </div>

      {/* Live readouts */}
      <section data-guide="bench-readouts" aria-label="Readouts" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {readouts.map((r) => (
          <div key={r.label} className="panel px-4 py-3">
            <p className="text-xs text-ink-3">{r.label}</p>
            <p className={cn('readout mt-1 text-lg font-medium', r.tone === 'live' ? 'text-sodium-strong' : 'text-ink')}>
              {r.value}
              {r.unit && <span className="ml-1 text-xs font-normal text-ink-3">{r.unit}</span>}
            </p>
          </div>
        ))}
      </section>

      {showTable && (
        <LabAssistantPanel
          module={m}
          where="bench"
          params={params}
          onApply={(patch) => {
            setParams((prev) => ({ ...prev, ...patch }))
            setStatus(null)
          }}
        />
      )}

      {showTable && (
        <section data-guide="bench-table" className="panel p-4 sm:p-5" aria-labelledby={`obs-${m.id}`}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={`obs-${m.id}`} className="font-display text-lg font-semibold tracking-tight">
              Observation table
            </h2>
            <p className="text-xs text-ink-3">{m.observation.hint}</p>
          </div>
          <ObservationTable module={m} rows={record.rows} onRemove={(id) => lab.removeRow(m.id, id)} onClear={() => lab.clearRows(m.id)} />
        </section>
      )}
    </div>
  )
}
