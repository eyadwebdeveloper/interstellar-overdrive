interface SparklineProps {
  data: number[]
  band?: [number, number]
  color?: string
  height?: number
  width?: number
  fill?: boolean
  className?: string
  label?: string
}

/** Tiny trend line with an optional "usual range" band. Decorative: the numeric value is always shown next to it. */
export default function Sparkline({
  data,
  band,
  color = 'var(--aura-purple)',
  height = 36,
  width = 120,
  fill = true,
  className,
  label,
}: SparklineProps) {
  if (data.length < 2) return null
  const pad = 3
  const min = Math.min(...data, ...(band ?? [])) - 1
  const max = Math.max(...data, ...(band ?? [])) + 1
  const span = max - min || 1
  const x = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2)
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2)
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1).toFixed(1)},${height - pad} L${x(0).toFixed(1)},${height - pad} Z`
  const gid = `spark-${Math.abs(data.reduce((a, b) => a * 31 + b * 7, 7)) % 99999}`

  return (
    <svg
      className={className ? `rf-chart ${className}` : 'rf-chart'}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label ?? 'Trend over the last 14 days'}
    >
      {band && (
        <rect
          x={0}
          y={y(band[1])}
          width={width}
          height={Math.max(2, y(band[0]) - y(band[1]))}
          rx={3}
          fill="rgba(34, 197, 94, 0.10)"
        />
      )}
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={2.6} fill={color} />
    </svg>
  )
}
