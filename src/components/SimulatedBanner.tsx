import { useAuraSource } from '../hooks/useAura'
import '../styles/aura-api.css'

/** Always visible where AI output appears. States source (live backend vs built-in demo) and that data is simulated. */
export default function SimulatedBanner() {
  const { source } = useAuraSource()
  const origin =
    source === 'live'
      ? 'Connected to the local AURA backend.'
      : source === 'loading'
        ? 'Checking for the local AURA backend…'
        : 'Local backend not reachable, so built-in demo data is shown.'
  return (
    <div className="api-banner" role="note">
      <strong>Simulated data.</strong> {origin} Advisory output is not a diagnosis and does not replace
      clinical judgment or official procedures.
    </div>
  )
}
