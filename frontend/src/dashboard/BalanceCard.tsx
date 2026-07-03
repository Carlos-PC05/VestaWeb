import { formatCurrency } from '../lib/format'
import { IconTrendDown, IconTrendUp } from '../lib/icons'

interface BalanceCardProps {
  balance: number
  periodNet: number
  loading: boolean
}

/**
 * Cifra hero del dashboard: saldo total acumulado (proxy de "patrimonio
 * total" mientras la cartera de inversión no existe) y la variación neta
 * del periodo seleccionado, para dar contexto inmediato de tendencia.
 */
export function BalanceCard({ balance, periodNet, loading }: BalanceCardProps) {
  if (loading) {
    return (
      <div className="balance-card">
        <div className="skeleton skeleton-label" />
        <div className="skeleton skeleton-hero" />
      </div>
    )
  }

  const isPositiveNet = periodNet >= 0
  const TrendIcon = isPositiveNet ? IconTrendUp : IconTrendDown

  return (
    <div className="balance-card">
      <p className="balance-card__label">Patrimonio total (según tus movimientos)</p>
      <p className="balance-card__value num">{formatCurrency(balance)}</p>
      <p
        className="balance-card__trend"
        data-tone={isPositiveNet ? 'positive' : 'negative'}
      >
        <TrendIcon width={16} height={16} aria-hidden="true" />
        <span className="num">{formatCurrency(Math.abs(periodNet))}</span>
        <span>en el periodo</span>
      </p>
    </div>
  )
}
