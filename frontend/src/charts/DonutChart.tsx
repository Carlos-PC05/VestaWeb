import { useId } from 'react'
import './charts.css'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  slices: DonutSlice[]
  formatValue: (value: number) => string
  /** Texto pequeño del centro del donut (p. ej. "Total"). */
  centerLabel?: string
  size?: number
}

const STROKE = 18

/**
 * Donut SVG con leyenda, dibujado a mano (sin librería de charting). Reutilizado
 * en gastos por categoría (dashboard) y distribución por clase de activo
 * (cartera). Cada segmento es un arco `stroke-dasharray` sobre un círculo.
 */
export function DonutChart({ slices, formatValue, centerLabel, size = 180 }: DonutChartProps) {
  const titleId = useId()
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const radius = (size - STROKE) / 2
  const circumference = 2 * Math.PI * radius

  // Offset acumulado para encadenar los arcos alrededor del círculo (sin mutar
  // una variable externa al map: se arrastra el acumulado con reduce).
  const arcs = slices.reduce<
    { acc: number; items: (DonutSlice & { fraction: number; dash: number; gap: number; dashOffset: number })[] }
  >(
    (state, slice) => {
      const fraction = total > 0 ? slice.value / total : 0
      state.items.push({
        ...slice,
        fraction,
        dash: fraction * circumference,
        gap: circumference - fraction * circumference,
        dashOffset: -state.acc * circumference,
      })
      state.acc += fraction
      return state
    },
    { acc: 0, items: [] },
  ).items

  return (
    <div className="donut">
      <svg
        className="donut__svg"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>Distribución: {slices.map((s) => s.label).join(', ')}</title>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {total === 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--surface-raised)"
              strokeWidth={STROKE}
            />
          ) : (
            arcs.map((arc) => (
              <circle
                key={arc.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE}
                strokeDasharray={`${arc.dash} ${arc.gap}`}
                strokeDashoffset={arc.dashOffset}
              />
            ))
          )}
        </g>
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          className="donut__center-label"
          fill="var(--muted)"
        >
          {centerLabel ?? 'Total'}
        </text>
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          className="donut__center-value num"
          fill="var(--ink)"
        >
          {formatValue(total)}
        </text>
      </svg>

      <ul className="donut__legend">
        {arcs.map((arc) => (
          <li key={arc.label} className="donut__legend-item">
            <span className="donut__swatch" style={{ background: arc.color }} aria-hidden="true" />
            <span className="donut__legend-label">{arc.label}</span>
            <span className="donut__legend-pct num">{Math.round(arc.fraction * 100)}%</span>
            <span className="donut__legend-value num">{formatValue(arc.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
