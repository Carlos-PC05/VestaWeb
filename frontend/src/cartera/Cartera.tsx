import { useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { RangeSelector } from '../charts/RangeSelector'
import { AreaTrend } from '../charts/AreaTrend'
import { Donut } from '../charts/Donut'
import { Card } from '../app/Card'
import { Button } from '../app/Button'
import { IconPlus } from '../lib/icons'
import { CLASS_LABEL } from '../lib/api'
import type { CarteraData } from '../app/loaders'
import { assetMetrics, carteraSeries, distribucionPorClase, totalCartera } from '../lib/aggregate'
import { formatCurrency, formatNumber, formatPercent } from '../lib/format'
import type { Range } from '../lib/range'
import { AssetForm } from './AssetForm'
import './cartera.css'

/**
 * Pantalla de cartera (EP-W03): valor de la cartera con gráfico de
 * tendencia, distribución por clase de activo, y la tabla de activos —
 * pulsar una fila navega al detalle; el botón de la cabecera abre el alta
 * de activo (HU-W03.01, HU-W03.02).
 */
export function Cartera() {
  const { assets, txsByAsset } = useLoaderData() as CarteraData
  // Rango temporal del hero; controla la serie de valor de cartera mostrada.
  const [range, setRange] = useState<Range>('1A')
  const [formOpen, setFormOpen] = useState(false)
  const navigate = useNavigate()

  const serie = carteraSeries(assets, txsByAsset, range)
  const total = totalCartera(assets, txsByAsset)
  const dist = distribucionPorClase(assets, txsByAsset)

  return (
    <>
      <Card
        title="Valor de la cartera"
        action={<RangeSelector value={range} onChange={setRange} />}
        className="hero-card"
      >
        <div className="cartera-hero-head">
          <p className="hero-figure num">{formatCurrency(total.marketValue)}</p>
          {total.cost > 0 && (
            <span className={`hero-delta num ${total.pnl >= 0 ? 'tone-positive' : 'tone-negative'}`}>
              {total.pnl >= 0 ? '+' : ''}
              {formatCurrency(total.pnl)} ({formatPercent(total.pnlPct)})
            </span>
          )}
        </div>
        <AreaTrend data={serie} height={300} />
      </Card>

      <div className="cartera-lower">
        <Card title="Distribución por clase">
          <Donut data={dist} />
        </Card>

        <Card
          title="Activos"
          action={
            <Button variant="primary" icon={<IconPlus />} onClick={() => setFormOpen(true)}>
              Añadir activo
            </Button>
          }
        >
          {assets.length === 0 ? (
            <p className="empty">
              Tu cartera está vacía. Da de alta el primer activo y registra sus operaciones para
              ver aquí su evolución.
            </p>
          ) : (
            <div className="asset-table">
              <div className="asset-row asset-head">
                <span>Activo</span>
                <span className="ta-r">Participaciones</span>
                <span className="ta-r">Cotización</span>
                <span className="ta-r">Valor</span>
                <span className="ta-r">Rentabilidad</span>
              </div>
              {assets.map((a) => {
                const m = assetMetrics(a, txsByAsset.get(a.id) ?? [])
                const tone = m.pnl >= 0 ? 'tone-positive' : 'tone-negative'
                const cotizado = a.naturaleza === 'cotizado'
                return (
                  <button
                    type="button"
                    key={a.id}
                    className="asset-row"
                    onClick={() => navigate(`/cartera/${a.id}`)}
                  >
                    <span className="asset-name">
                      <span className="asset-title">{a.name}</span>
                      <span className="asset-sub">
                        {cotizado ? `${a.ticker} · ${CLASS_LABEL[a.class]}` : CLASS_LABEL[a.class]}
                      </span>
                    </span>
                    <span className="ta-r num">{cotizado ? formatNumber(m.shares) : '—'}</span>
                    <span className="ta-r num">
                      {a.currentPrice !== null ? formatCurrency(a.currentPrice) : '—'}
                    </span>
                    <span className="ta-r num">{formatCurrency(m.marketValue)}</span>
                    <span className={`ta-r num ${m.cost > 0 ? tone : ''}`}>
                      {m.cost > 0 ? formatPercent(m.pnlPct) : '—'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {formOpen && <AssetForm onClose={() => setFormOpen(false)} />}
    </>
  )
}
