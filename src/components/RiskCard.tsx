import { Badge, Panel } from './ui'
import { useAuraSource, useRisk } from '../hooks/useAura'
import type { RiskBand } from '../api/contract'
import '../styles/aura-api.css'

const BAND_TEXT: Record<RiskBand, { label: string; text: string }> = {
  none: { label: 'No pattern', text: 'No deconditioning pattern relative to your own baseline.' },
  early: { label: 'Early pattern', text: 'Some early movement away from your own cardiovascular range.' },
  established: { label: 'Established pattern', text: 'A sustained movement away from your own cardiovascular range.' },
}

export default function RiskCard() {
  const risk = useRisk()
  const { source } = useAuraSource()
  if (!risk) return null
  const pct = Math.round(risk.confidence * 100)
  const band = BAND_TEXT[risk.band]
  return (
    <Panel
      className="api-card"
      title="Cardiovascular conditioning trend"
      subtitle="Advisory only · Tier 2 model"
      action={<Badge tone={risk.band === 'none' ? 'neutral' : 'warning'}>{band.label}</Badge>}
    >
      <p>{band.text}</p>
      {risk.drivers.length > 0 && (
        <ul className="api-list">
          {risk.drivers.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
      <div className="api-confidence">
        <span className="field-label">Model confidence</span>
        <div className="score-bar" role="img" aria-label={`Model confidence ${pct} percent`}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <strong>{pct}%</strong>
      </div>
      <p className="small-text muted">
        Not a diagnosis. {source === 'live' ? 'Trained and scored on simulated crew data.' : 'Built-in demo values.'}{' '}
        This model cannot create an official alert; only the rules do.
      </p>
    </Panel>
  )
}
