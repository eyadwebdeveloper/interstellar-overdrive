interface CircularProgressProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  sublabel?: string
}

export default function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'var(--aura-purple)',
  label,
  sublabel,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="aura-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="aura-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="aura-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="aura-ring-label" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: size * 0.22, color }}>{value}%</div>
        {label && (
          <div style={{ fontSize: size * 0.09, color: 'var(--aura-text-muted)', fontWeight: 600 }}>
            {label}
          </div>
        )}
        {sublabel && (
          <div style={{ fontSize: size * 0.08, color: 'var(--aura-text-muted)', marginTop: 2 }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}
