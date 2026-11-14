export type StatusLevel = 'normal' | 'watch' | 'act' | 'emergency' | 'neutral' | 'brand'

const LEVELS: Record<StatusLevel, { cls: string; label: string }> = {
  normal: { cls: 'ok', label: 'Normal' },
  watch: { cls: 'watch', label: 'Watch' },
  act: { cls: 'act', label: 'Act' },
  emergency: { cls: 'sos', label: 'Emergency' },
  neutral: { cls: 'neutral', label: 'Info' },
  brand: { cls: 'brand', label: 'Info' },
}

interface StatusPillProps {
  level: StatusLevel
  label?: string
  dot?: boolean
  small?: boolean
}

/** Status is always colour + icon/dot + word, never colour alone. */
export default function StatusPill({ level, label, dot = true, small = false }: StatusPillProps) {
  const cfg = LEVELS[level]
  return (
    <span className={`rf-pill ${cfg.cls}${small ? ' small' : ''}`}>
      {dot && <span className="dot" aria-hidden="true" />}
      {label ?? cfg.label}
    </span>
  )
}
