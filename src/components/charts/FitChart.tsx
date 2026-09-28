import { CartesianGrid, ComposedChart, Label, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts'
import type { AnalysisOutput } from '@/types/experiment'
import { sig } from '@/utils/format'

/** Round axis limits outward to 1, 2, 2.5 or 5 × 10ⁿ steps, as you would on graph paper. */
function niceTicks(lo: number, hi: number, target = 6): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return [lo, hi]
  const raw = (hi - lo) / target
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((st) => st >= raw) ?? 10 * mag
  const start = Math.floor(lo / step + 1e-9) * step
  const end = Math.ceil(hi / step - 1e-9) * step
  const ticks: number[] = []
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toPrecision(12)))
  return ticks
}

/**
 * The lab graph: measured points (sodium) and the least-squares line (Prussian blue),
 * drawn on the same graph-paper grid as the rest of the lab.
 * The fit line is extended back to x = 0 so the intercept can be read, as on paper.
 */
export function FitChart({ analysis, height = 340 }: { analysis: AnalysisOutput; height?: number }) {
  const { points, fit, x, y, connectPoints } = analysis
  const xs = points.map((p) => p.x)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const xTicks = niceTicks(Math.min(0, minX), maxX)
  const x0 = xTicks[0]
  const x1 = xTicks[xTicks.length - 1]
  const line = fit ? [{ x: x0, fit: fit.intercept + fit.slope * x0 }, { x: x1, fit: fit.intercept + fit.slope * x1 }] : []
  const sorted = [...points].sort((a, b) => a.x - b.x)

  const ys = points.map((p) => p.y).concat(line.map((l) => l.fit))
  const yTicks = niceTicks(Math.min(0, ...ys), Math.max(...ys))
  const y0 = yTicks[0]
  const y1 = yTicks[yTicks.length - 1]

  const axisLabel = (a: { label: string; unit: string }) => (a.unit ? `${a.label} (${a.unit})` : a.label)

  return (
    <div style={{ height }} className="w-full" role="img" aria-label={`Graph of ${y.label} against ${x.label}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 12, right: 18, bottom: 28, left: 12 }}>
          <CartesianGrid stroke="var(--grid-major)" strokeDasharray="0" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[x0, x1]}
            ticks={xTicks}
            tickFormatter={(v: number) => sig(v, 3)}
            stroke="var(--ink-3)"
            tick={{ fill: 'var(--ink-2)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            allowDataOverflow
          >
            <Label value={axisLabel(x)} position="bottom" offset={10} style={{ fill: 'var(--ink-2)', fontSize: 12 }} />
          </XAxis>
          <YAxis
            type="number"
            domain={[y0, y1]}
            ticks={yTicks}
            tickFormatter={(v: number) => sig(v, 3)}
            stroke="var(--ink-3)"
            tick={{ fill: 'var(--ink-2)', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            width={68}
            allowDataOverflow
          >
            <Label value={axisLabel(y)} angle={-90} position="insideLeft" offset={0} style={{ fill: 'var(--ink-2)', fontSize: 12, textAnchor: 'middle' }} />
          </YAxis>
          {y0 < 0 && <ReferenceLine y={0} stroke="var(--ink-3)" />}
          {x0 < 0 && <ReferenceLine x={0} stroke="var(--ink-3)" />}
          <Tooltip
            cursor={{ stroke: 'var(--ink-3)', strokeDasharray: '3 3' }}
            contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 12 }}
            labelStyle={{ color: 'var(--ink-3)' }}
            formatter={(v) => sig(Number(v), 4)}
            labelFormatter={(v) => `${x.label} = ${sig(Number(v), 4)}`}
          />
          {fit && (
            <Line
              data={line}
              dataKey="fit"
              name="Best fit"
              stroke="var(--prussian)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              type="linear"
            />
          )}
          {connectPoints && (
            <Line data={sorted} dataKey="y" name={y.label} stroke="var(--prussian)" strokeWidth={1.5} dot={false} isAnimationActive={false} type="monotone" />
          )}
          <Scatter data={points} dataKey="y" name={y.label} fill="var(--sodium)" stroke="var(--sodium-strong)" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
