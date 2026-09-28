import type { ParameterDef, Params } from '@/types/experiment'
import { decimalsOf, fixed } from '@/utils/format'
import { cn } from '@/utils/cn'

/** Renders every control an experiment declares in `parameters`. */
export function ParameterPanel({
  defs,
  params,
  onChange,
  disabled,
}: {
  defs: ParameterDef[]
  params: Params
  onChange: (key: string, value: number | string | boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-4">
      {defs
        .filter((d) => !d.visible || d.visible(params))
        .map((d) => {
          const id = `param-${d.key}`
          if (d.kind === 'range') {
            const v = Number(params[d.key])
            const decimals = d.decimals ?? decimalsOf(d.step)
            const fill = ((v - d.min) / (d.max - d.min)) * 100
            return (
              <div key={d.key}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
                    {d.label}
                  </label>
                  <span className="readout text-sm text-ink">
                    {fixed(v, decimals)}
                    {d.unit && <span className="ml-1 text-ink-3">{d.unit}</span>}
                  </span>
                </div>
                <input
                  id={id}
                  type="range"
                  className="range"
                  min={d.min}
                  max={d.max}
                  step={d.step}
                  value={v}
                  disabled={disabled}
                  style={{ ['--fill' as string]: `${fill}%` }}
                  onChange={(e) => onChange(d.key, Number(e.target.value))}
                  aria-describedby={d.hint ? `${id}-hint` : undefined}
                />
                {d.hint && (
                  <p id={`${id}-hint`} className="mt-0.5 text-xs text-ink-3">
                    {d.hint}
                  </p>
                )}
              </div>
            )
          }
          if (d.kind === 'select') {
            return (
              <div key={d.key}>
                <label htmlFor={id} className="mb-1 block text-[13px] font-medium text-ink-2">
                  {d.label}
                </label>
                <select
                  id={id}
                  value={String(params[d.key])}
                  disabled={disabled}
                  onChange={(e) => onChange(d.key, e.target.value)}
                  className="h-9 w-full rounded-lg border border-line bg-panel px-2.5 text-sm text-ink"
                >
                  {d.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {d.hint && <p className="mt-0.5 text-xs text-ink-3">{d.hint}</p>}
              </div>
            )
          }
          const on = Boolean(params[d.key])
          return (
            <div key={d.key} className="flex items-center justify-between gap-3">
              <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
                {d.label}
                {d.hint && <span className="block text-xs font-normal text-ink-3">{d.hint}</span>}
              </label>
              <Switch id={id} checked={on} disabled={disabled} onChange={(v) => onChange(d.key, v)} />
            </div>
          )
        })}
    </div>
  )
}

export function Switch({
  id,
  checked,
  onChange,
  disabled,
  label,
}: {
  id?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        checked ? 'bg-prussian' : 'bg-line',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full bg-panel shadow transition-transform',
          checked ? 'translate-x-4.5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
