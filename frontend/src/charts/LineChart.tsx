import { useId, useMemo, useState } from 'react'
import './charts.css'

export interface LinePoint {
  label: string
  value: number
}

interface LineChartProps {
  points: LinePoint[]
  /** Formatea el valor en el tooltip (p. ej. importe en euros o precio). */
  formatValue: (value: number) => string
  /** Tono de la línea: 'auto' lo decide la pendiente global (verde sube, rojo baja). */
  tone?: 'auto' | 'positive' | 'negative'
  height?: number
  ariaLabel?: string
}

const VIEW_WIDTH = 800
const PADDING_Y = 12

/**
 * Gráfico de línea con área, dibujado a mano en SVG (sin librería de charting,
 * NFR-W16). Una sola serie temporal con tooltip al pasar el cursor. Compartido
 * por el dashboard (patrimonio), la cartera (capital invertido) y el detalle de
 * activo (cotización).
 */
export function LineChart({
  points,
  formatValue,
  tone = 'auto',
  height = 260,
  ariaLabel = 'Evolución',
}: LineChartProps) {
  const gradientId = useId()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { path, areaPath, coords, negative } = useMemo(() => {
    if (points.length === 0) {
      return { path: '', areaPath: '', coords: [] as { x: number; y: number }[], negative: false }
    }
    const values = points.map((p) => p.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const stepX = points.length > 1 ? VIEW_WIDTH / (points.length - 1) : 0

    const pts = points.map((point, i) => ({
      x: points.length > 1 ? i * stepX : VIEW_WIDTH / 2,
      y: height - PADDING_Y - ((point.value - min) / span) * (height - PADDING_Y * 2),
    }))
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1].x.toFixed(2)},${height} L${pts[0].x.toFixed(2)},${height} Z`
    const isNeg = tone === 'negative' || (tone === 'auto' && values[values.length - 1] < values[0])
    return { path: line, areaPath: area, coords: pts, negative: isNeg }
  }, [points, height, tone])

  if (points.length < 2) {
    return (
      <div className="line-chart__empty" style={{ height }}>
        Todavía no hay suficiente histórico para dibujar la evolución.
      </div>
    )
  }

  const toneVar = negative ? 'var(--negative)' : 'var(--primary)'
  const hovered = hoverIndex !== null ? points[hoverIndex] : null
  const hoveredCoord = hoverIndex !== null ? coords[hoverIndex] : null

  return (
    <div className="line-chart" style={{ height }}>
      <svg
        className="line-chart__svg"
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const relX = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH
          const nearest = coords.reduce(
            (best, p, i) => (Math.abs(p.x - relX) < Math.abs(coords[best].x - relX) ? i : best),
            0,
          )
          setHoverIndex(nearest)
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={toneVar} stopOpacity="0.25" />
            <stop offset="100%" stopColor={toneVar} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={path} fill="none" stroke={toneVar} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hoveredCoord && (
          <>
            <line x1={hoveredCoord.x} x2={hoveredCoord.x} y1={0} y2={height} stroke="var(--border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <circle cx={hoveredCoord.x} cy={hoveredCoord.y} r={4} fill={toneVar} />
          </>
        )}
      </svg>

      {hovered && (
        <div className="line-chart__tooltip" aria-hidden="true">
          <span>{hovered.label}</span>
          <span className="num">{formatValue(hovered.value)}</span>
        </div>
      )}
    </div>
  )
}
