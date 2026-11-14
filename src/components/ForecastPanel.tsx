import { useState } from 'react'
import { Panel, Tabs } from './ui'
import { signalLabel } from '../api/adapters'
import { useForecast } from '../hooks/useAura'
import '../styles/aura-api.css'

const W = 320
const H = 120
const PAD = 6

function Chart({ history, mu, band, label }: { history: number[]; mu: number[]; band: number[]; label: string }) {
  const lo = Math.min(...history, ...mu.map((v, i) => v - (band[i] ?? 0)))
  const hi = Math.max(...history, ...mu.map((v, i) => v + (band[i] ?? 0)))
  const span = hi - lo || 1
  const n = history.length + mu.length
  const x = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2)
  const y = (v: number) => PAD + (1 - (v - lo) / span) * (H - PAD * 2)
  const h0 = history.length - 1
  const histPath = history.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const fcPath = [history[h0], ...mu]
    .map((v, i) => `${i ? 'L' : 'M'}${x(h0 + i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(' ')
  const upper = mu.map((v, i) => `${x(h0 + 1 + i).toFixed(1)},${y(v + (band[i] ?? 0)).toFixed(1)}`)
  const lower = mu.map((v, i) => `${x(h0 + 1 + i).toFixed(1)},${y(v - (band[i] ?? 0)).toFixed(1)}`).reverse()
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="api-chart" role="img" aria-label={label}>
      <polygon points={[...upper, ...lower].join(' ')} className="api-band" />
      <path d={histPath} className="api-line" fill="none" />
      <path d={fcPath} className="api-line api-line-forecast" fill="none" />
      <line x1={x(h0)} x2={x(h0)} y1={PAD} y2={H - PAD} className="api-today" />
    </svg>
  )
}

export default function ForecastPanel() {
  const forecast = useForecast()
  const [active, setActive] = useState(0)
  if (!forecast || forecast.series.length === 0) return null
  const s = forecast.series[Math.min(active, forecast.series.length - 1)]
  const last = s.mu.length - 1
  const method =
    forecast.backend === 'gru' ? 'small neural model' : forecast.backend === 'ridge' ? 'regression model' : 'straight-line trend'
  return (
    <Panel
      className="api-card"
      title={`Where this is heading · ${forecast.horizon_days} days`}
      subtitle="Advisory only · Tier 2 forecast"
    >
      <Tabs
        items={forecast.series.map((x, i) => ({ value: String(i), label: signalLabel(x.signal) }))}
        value={String(active)}
        onChange={(v: string) => setActive(Number(v))}
      />
      <Chart
        history={s.history}
        mu={s.mu}
        band={s.band}
        label={`${signalLabel(s.signal)}: last ${s.history.length} days, then a ${forecast.horizon_days}-day forecast with an uncertainty band`}
      />
      <p>
        <strong>
          {s.mu[last].toFixed(1)} {s.unit}
        </strong>{' '}
        expected in {forecast.horizon_days} days, give or take {s.band[last].toFixed(1)} {s.unit}.
      </p>
      <p className="small-text muted">
        Solid line: recorded. Dashed line and shaded area: forecast and uncertainty from a {method}. A forecast is
        not a diagnosis and cannot create an official alert. The shaded band is not a calibrated 95% interval.
      </p>
    </Panel>
  )
}
