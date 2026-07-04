import { formatCurrency, formatPercent } from '../lib/format'

interface StatCardProps {
  label: string
  value: number
  /** Variación relativa (fracción, p. ej. 0.024) mostrada como % con tono. */
  delta?: number
  caption?: string
  loading?: boolean
}

/**
 * Tarjeta de métrica del dashboard: etiqueta, cifra grande y variación opcional
 * con tono (verde positivo / rojo negativo). El signo del delta decide el tono.
 */
export function StatCard({ label, value, delta, caption, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="skeleton skeleton-line skeleton-line--sm" />
        <div className="skeleton skeleton-line skeleton-line--lg" />
      </div>
    )
  }

  const tone = delta === undefined ? undefined : delta >= 0 ? 'positive' : 'negative'

  return (
    <div className="stat-card">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value num">{formatCurrency(value)}</p>
      {(delta !== undefined || caption) && (
        <p className="stat-card__meta">
          {delta !== undefined && (
            <span className="stat-card__delta num" data-tone={tone}>
              {delta >= 0 ? '+' : '−'}
              {formatPercent(Math.abs(delta))}
            </span>
          )}
          {caption && <span className="stat-card__caption">{caption}</span>}
        </p>
      )}
    </div>
  )
}
