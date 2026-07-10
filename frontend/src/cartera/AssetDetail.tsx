import { useState } from 'react'
import { Link, useLoaderData, useNavigate, useRevalidator } from 'react-router-dom'
import { RangeSelector } from '../charts/RangeSelector'
import { AreaTrend } from '../charts/AreaTrend'
import { Card } from '../app/Card'
import { Button } from '../app/Button'
import { StatCard } from '../app/StatCard'
import { IconChevron, IconPlus, IconTrash } from '../lib/icons'
import { CLASS_LABEL, deleteAsset, deleteAssetTx } from '../lib/api'
import type { AssetDetailData } from '../app/loaders'
import { assetMetrics, positionValueSeries } from '../lib/aggregate'
import type { Range } from '../lib/range'
import { formatCurrency, formatFullDate, formatNumber, formatPercent } from '../lib/format'
import { AssetTxForm } from './AssetTxForm'
import './cartera.css'

/**
 * Detalle de un activo de cartera: evolución del valor de la posición,
 * métricas (valor de mercado, participaciones, rentabilidad), historial de
 * operaciones con alta (HU-W03.03) y borrado, y eliminación del activo.
 * El activo se resuelve por `id` de ruta (`/cartera/:id`); si no existe,
 * el loader lanza y la ruta muestra su pantalla de error.
 */
export function AssetDetail() {
  const { asset, txs } = useLoaderData() as AssetDetailData
  const revalidator = useRevalidator()
  const navigate = useNavigate()
  // Rango temporal del hero; controla qué tramo de la evolución se muestra.
  const [range, setRange] = useState<Range>('1A')
  const [formOpen, setFormOpen] = useState(false)

  const metrics = assetMetrics(asset, txs)
  const serie = positionValueSeries(asset, txs, range)
  const first = serie.length ? serie[0].v : 0
  const variacion = serie.length ? serie[serie.length - 1].v - first : 0
  const variacionPct = first === 0 ? 0 : variacion / first
  const cotizado = asset.naturaleza === 'cotizado'

  /** Borra una operación tras confirmar y revalida métricas y series. */
  async function handleDeleteTx(id: number) {
    if (!confirm('¿Eliminar esta operación?')) return
    try {
      await deleteAssetTx(id)
      revalidator.revalidate()
    } catch {
      alert('No se pudo eliminar la operación. Comprueba el backend e inténtalo de nuevo.')
    }
  }

  /** Borra el activo completo (sus operaciones caen en cascada) y vuelve a Cartera. */
  async function handleDeleteAsset() {
    if (!confirm(`¿Eliminar "${asset.name}" y todas sus operaciones?`)) return
    try {
      await deleteAsset(asset.id)
      navigate('/cartera')
    } catch {
      alert('No se pudo eliminar el activo. Comprueba el backend e inténtalo de nuevo.')
    }
  }

  return (
    <>
      <Link to="/cartera" className="back-link">
        <IconChevron dir="left" size={16} /> Volver a Cartera
      </Link>

      <Card
        title={cotizado ? `${asset.name} · ${asset.ticker}` : asset.name}
        action={<RangeSelector value={range} onChange={setRange} />}
        className="hero-card"
      >
        <div className="cartera-hero-head">
          <p className="hero-figure num">{formatCurrency(metrics.marketValue)}</p>
          {serie.length > 1 && (
            <span className={`hero-delta num ${variacion >= 0 ? 'tone-positive' : 'tone-negative'}`}>
              {variacion >= 0 ? '+' : ''}
              {formatCurrency(variacion)} ({formatPercent(variacionPct)}) · {range}
            </span>
          )}
        </div>
        <AreaTrend data={serie} height={300} />
      </Card>

      <div className="stat-row">
        <StatCard
          label={cotizado ? 'Cotización' : 'Valoración manual'}
          value={
            asset.currentPrice !== null
              ? formatCurrency(asset.currentPrice)
              : asset.manualValue !== null
                ? formatCurrency(asset.manualValue)
                : '—'
          }
          sub={!cotizado && asset.valuedAt ? `a ${formatFullDate(asset.valuedAt)}` : undefined}
        />
        <StatCard label="Valor de mercado" value={formatCurrency(metrics.marketValue)} />
        <StatCard
          label="Posiciones"
          value={cotizado ? formatNumber(metrics.shares) : '—'}
          sub={CLASS_LABEL[asset.class]}
        />
        <StatCard
          label="Rentabilidad"
          value={metrics.cost > 0 ? formatCurrency(metrics.pnl) : '—'}
          sub={metrics.cost > 0 ? formatPercent(metrics.pnlPct) : 'Sin coste registrado'}
          tone={metrics.cost > 0 ? (metrics.pnl >= 0 ? 'positive' : 'negative') : 'neutral'}
        />
      </div>

      <Card
        title="Historial de operaciones"
        action={
          <div className="card-actions">
            <Button variant="ghost" icon={<IconTrash />} onClick={handleDeleteAsset}>
              Eliminar activo
            </Button>
            <Button variant="primary" icon={<IconPlus />} onClick={() => setFormOpen(true)}>
              Añadir operación
            </Button>
          </div>
        }
      >
        {txs.length === 0 ? (
          <p className="empty">
            Sin operaciones registradas. Añade la primera compra para calcular la posición.
          </p>
        ) : (
          <div className="tx-table">
            <div className="tx-row tx-head">
              <span>Fecha</span>
              <span>Tipo</span>
              <span className="ta-r">Cantidad</span>
              <span className="ta-r">Precio</span>
              <span className="ta-r">Comisión</span>
              <span className="ta-r">Total</span>
              <span aria-hidden="true" />
            </div>
            {txs.map((t) => {
              const total = t.shares * t.unitPrice + t.fee
              return (
                <div key={t.id} className="tx-row">
                  <span>{formatFullDate(t.date)}</span>
                  <span className={t.type === 'compra' ? 'tone-positive' : 'tone-negative'}>
                    {t.type}
                  </span>
                  <span className="ta-r num">{formatNumber(t.shares)}</span>
                  <span className="ta-r num">{formatCurrency(t.unitPrice)}</span>
                  <span className="ta-r num">{formatCurrency(t.fee)}</span>
                  <span className="ta-r num">{formatCurrency(total)}</span>
                  <button
                    type="button"
                    className="row-delete"
                    aria-label="Eliminar operación"
                    onClick={() => handleDeleteTx(t.id)}
                  >
                    <IconTrash />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {formOpen && <AssetTxForm assetId={asset.id} onClose={() => setFormOpen(false)} />}
    </>
  )
}
