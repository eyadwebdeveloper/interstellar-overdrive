import type { VitalSign } from '../data/vitalsData'
import {
  Heart, Activity, Wind, Thermometer, Scale,
  Moon, Zap, HeartPulse, Flame, ShieldAlert
} from 'lucide-react'
import type { ComponentType } from 'react'
import Sparkline from './Sparkline'
import StatusPill from './StatusPill'

const ICON_MAP: Record<string, ComponentType<{ size?: number }>> = {
  heart: Heart,
  activity: Activity,
  wind: Wind,
  thermometer: Thermometer,
  scale: Scale,
  moon: Moon,
  zap: Zap,
  'heart-pulse': HeartPulse,
  flame: Flame,
  'shield-alert': ShieldAlert,
}

interface MetricCardProps {
  vital: VitalSign
  compact?: boolean
  showSpark?: boolean
}

export default function MetricCard({ vital, compact = false, showSpark = true }: MetricCardProps) {
  const Icon = ICON_MAP[vital.icon] || Heart
  const pillLevel = vital.status === 'normal' ? 'normal' : vital.status === 'watch' ? 'watch' : vital.status === 'act' ? 'act' : 'emergency'

  return (
    <div className="rf-card rf-tile" style={{ padding: compact ? 13 : 16 }}>
      <div className="rf-tile-top">
        <div className="rf-tile-icon" style={{ background: vital.bgColor, color: vital.color }}>
          <Icon size={compact ? 15 : 17} />
        </div>
        <span className="rf-tile-label">{vital.label}</span>
      </div>

      <div className="rf-tile-value">
        <b style={{ fontSize: compact ? 24 : 28 }}>{vital.display ?? vital.value}</b>
        <span className="rf-tile-unit">{vital.unit}</span>
        {vital.delta !== undefined && (
          <span className="rf-delta">
            {vital.trend === 'down' ? '↓' : vital.trend === 'up' ? '↑' : ''}
            {Math.abs(vital.delta)}
          </span>
        )}
      </div>

      {showSpark && (
        <Sparkline
          data={vital.spark}
          band={vital.normalRange}
          color={vital.color}
          height={compact ? 30 : 34}
          width={150}
          label={`${vital.label} trend, last 14 days`}
        />
      )}

      <div className="rf-tile-foot">
        <StatusPill level={pillLevel} label={vital.statusLabel} small />
        <span className="rf-note" style={{ fontSize: 10.5 }}>{vital.confidence}% conf.</span>
      </div>
    </div>
  )
}
