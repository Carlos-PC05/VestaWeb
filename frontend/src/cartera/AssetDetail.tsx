import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RangeSelector } from '../charts/RangeSelector'
import { AreaTrend } from '../charts/AreaTrend'
import { Card } from '../app/Card'
import { StatCard } from '../app/StatCard'
import { IconChevron } from '../lib/icons'
import { assets, assetTransactions, priceHistory } from '../lib/mock'
import { assetMetrics } from '../lib/aggregate'
import { rangeStart, type Range } from '../lib/range'
import { formatCurrency, formatFullDate, formatNumber, formatPercent } from '../lib/format'
import './cartera.css'

/**
 * Detalle de un activo de cartera: cotización con gráfico de tendencia,
 * métricas de posición (valor de mercado, participaciones, rentabilidad) e
 * historial de transacciones. El activo se resuelve por `id` de ruta
 * (`/cartera/:id`); si no existe, muestra un estado vacío con enlace de vuelta.
 */
export function AssetDetail() {
  const { id } = useParams()
  // Rango temporal del hero; controla qué tramo del histórico de precio se muestra.
  const [range, setRange] = useState<Range>('1A')
  const asset = assets.find((a) => a.id === id)

  // Ruta con un id de activo inexistente: se evita renderizar el resto de la
  // pantalla, que asume que `asset` existe.
  if (!asset) {
    return (
      <Card>
        <p className="empty">Activo no encontrado.</p>
        <Link to="/cartera" className="back-link">
          <IconChevron dir="left" size={16} /> Volver a Cartera
        </Link>
      </Card>
    )
  }

  const metrics = assetMetrics(asset)
  const serie = priceHistory(asset.id).filter((p) => p.t >= rangeStart(range))
  const first = serie.length ? serie[0].v : asset.currentPrice
  const variacion = asset.currentPrice - first
  const variacionPct = first === 0 ? 0 : variacion / first
  const txs = assetTransactions(asset.id)

  return (
    <>
      <Link to="/cartera" className="back-link">
        <IconChevron dir="left" size={16} /> Volver a Cartera
      </Link>

      <Card
        title={`${asset.name} · ${asset.ticker}`}
        action={<RangeSelector value={range} onChange={setRange} />}
        className="hero-card"
      >
        <div className="cartera-hero-head">
          <p className="hero-figure num">{formatCurrency(asset.currentPrice)}</p>
          <span className={`hero-delta num ${variacion >= 0 ? 'tone-positive' : 'tone-negative'}`}>
            {variacion >= 0 ? '+' : ''}
            {formatCurrency(variacion)} ({formatPercent(variacionPct)}) · {range}
          </span>
        </div>
        <AreaTrend data={serie} height={300} />
      </Card>

      <div className="stat-row">
        <StatCard label="Cotización" value={formatCurrency(asset.currentPrice)} />
        <StatCard label="Valor de mercado" value={formatCurrency(metrics.marketValue)} />
        <StatCard label="Posiciones" value={formatNumber(asset.shares)} sub={`${asset.class}`} />
        <StatCard
          label="Rentabilidad"
          value={formatCurrency(metrics.pnl)}
          sub={formatPercent(metrics.pnlPct)}
          tone={metrics.pnl >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <Card title="Historial de transacciones">
        <div className="tx-table">
          <div className="tx-row tx-head">
            <span>Fecha</span>
            <span>Tipo</span>
            <span className="ta-r">Cantidad</span>
            <span className="ta-r">Precio</span>
            <span className="ta-r">Comisión</span>
            <span className="ta-r">Total</span>
          </div>
          {txs.map((t) => {
            const total = t.shares * t.price + t.fee
            return (
              <div key={t.id} className="tx-row">
                <span>{formatFullDate(t.date)}</span>
                <span className={t.type === 'compra' ? 'tone-positive' : 'tone-negative'}>{t.type}</span>
                <span className="ta-r num">{formatNumber(t.shares)}</span>
                <span className="ta-r num">{formatCurrency(t.price)}</span>
                <span className="ta-r num">{formatCurrency(t.fee)}</span>
                <span className="ta-r num">{formatCurrency(total)}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
