import { useId, useMemo, useState } from 'react'
import { RANGE_OPTIONS, type DashboardRange, type SeriesPoint } from '../lib/aggregate'
import { formatCurrency } from '../lib/format'

interface EvolutionChartProps {
  series: SeriesPoint[]
  range: DashboardRange
  onRangeChange: (range: DashboardRange) => void
  loading: boolean
}

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 220
const PADDING_Y = 16

/**
 * Gráfico de evolución del saldo acumulado (HU-W04.02): SVG dibujado a mano,
 * sin librería de charting, porque es una sola serie temporal. Incluye el
 * selector de rango y un tooltip al pasar el cursor sobre la línea.
 */
export function EvolutionChart({ series, range, onRangeChange, loading }: EvolutionChartProps) {
  const gradientId = useId()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { path, areaPath, points, isNegativeTrend } = useMemo(() => {
    if (series.length === 0) {
      return { path: '', areaPath: '', points: [] as { x: number; y: number }[], isNegativeTrend: false }
    }
    const values = series.map((p) => p.balance)
    const min = Math.min(...values, 0)
    const max = Math.max(...values, 0)
    const span = max - min || 1
    const stepX = series.length > 1 ? VIEW_WIDTH / (series.length - 1) : 0

    const pts = series.map((point, i) => ({
      x: series.length > 1 ? i * stepX : VIEW_WIDTH / 2,
      y:
        VIEW_HEIGHT -
        PADDING_Y -
        ((point.balance - min) / span) * (VIEW_HEIGHT - PADDING_Y * 2),
    }))

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    const area = `${linePath} L${pts[pts.length - 1].x},${VIEW_HEIGHT} L${pts[0].x},${VIEW_HEIGHT} Z`

    return { path: linePath, areaPath: area, points: pts, isNegativeTrend: values.at(-1)! < 0 }
  }, [series])

  if (loading) {
    return (
      <div className="evolution-chart">
        <div className="skeleton skeleton-chart" />
      </div>
    )
  }

  const toneVar = isNegativeTrend ? 'var(--negative)' : 'var(--primary)'
  const hovered = hoverIndex !== null ? series[hoverIndex] : null
  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className="evolution-chart">
      <div className="evolution-chart__header">
        <h2>Evolución del saldo</h2>
        <div className="range-selector" role="group" aria-label="Rango temporal">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="range-selector__option"
              aria-pressed={option.value === range}
              onClick={() => onRangeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {series.length < 2 ? (
        <p className="evolution-chart__empty">
          Todavía no hay suficiente histórico en este rango para dibujar la evolución.
        </p>
      ) : (
        <svg
          className="evolution-chart__svg"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Evolución del saldo en el rango ${range}`}
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            const relativeX = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH
            const nearest = points.reduce(
              (best, p, i) =>
                Math.abs(p.x - relativeX) < Math.abs(points[best].x - relativeX) ? i : best,
              0,
            )
            setHoverIndex(nearest)
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={toneVar} stopOpacity="0.28" />
              <stop offset="100%" stopColor={toneVar} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <path d={path} fill="none" stroke={toneVar} strokeWidth={2} strokeLinejoin="round" />
          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                x2={hoveredPoint.x}
                y1={0}
                y2={VIEW_HEIGHT}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={4} fill={toneVar} />
            </>
          )}
        </svg>
      )}

      {hovered && (
        <div className="evolution-chart__tooltip" aria-hidden="true">
          <span>{hovered.label}</span>
          <span className="num">{formatCurrency(hovered.balance)}</span>
        </div>
      )}
    </div>
  )
}
