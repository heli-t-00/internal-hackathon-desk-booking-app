// Simple SVG progress ring for occupancy %.
export function OccupancyGauge({ pct, size = 92, label }: { pct: number; size?: number; label?: string }) {
  const stroke = 9
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  const colour = pct >= 80 ? 'var(--red)' : pct >= 55 ? 'var(--amber)' : 'var(--green)'
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colour}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{pct}%</div>
          {label && <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>{label}</div>}
        </div>
      </div>
    </div>
  )
}
