import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RangeSelector } from '../charts/RangeSelector'
import { AreaTrend } from '../charts/AreaTrend'
import { Donut } from '../charts/Donut'
import { Card } from '../app/Card'
import { assets } from '../lib/mock'
import { assetMetrics, capitalInvertidoSeries, distribucionPorClase, totalCartera } from '../lib/aggregate'
import { formatCurrency, formatNumber, formatPercent } from '../lib/format'
import type { Range } from '../lib/range'
import './cartera.css'

/**
 * Pantalla de cartera (EP-W03): capital invertido con gráfico de tendencia,
 * distribución del valor por clase de activo, y la tabla de activos —
 * pulsar una fila navega al detalle del activo. Usa datos mock
 * (`../lib/mock`) hasta que exista backend de cotizaciones.
 */
export function Cartera() {
  // Rango temporal del hero; controla la serie de capital invertido mostrada.
  const [range, setRange] = useState<Range>('1A')
  const navigate = useNavigate()
  const serie = capitalInvertidoSeries(range)
  const total = totalCartera()
  const dist = distribucionPorClase()

  return (
    <>
      <Card
        title="Capital invertido"
        action={<RangeSelector value={range} onChange={setRange} />}
        className="hero-card"
      >
        <div className="cartera-hero-head">
          <p className="hero-figure num">{formatCurrency(total.marketValue)}</p>
          <span className={`hero-delta num ${total.pnl >= 0 ? 'tone-positive' : 'tone-negative'}`}>
            {total.pnl >= 0 ? '+' : ''}
            {formatCurrency(total.pnl)} ({formatPercent(total.pnlPct)})
          </span>
        </div>
        <AreaTrend data={serie} height={300} />
      </Card>

      <div className="cartera-lower">
        <Card title="Distribución por clase">
          <Donut data={dist} />
        </Card>

        <Card title="Activos">
          <div className="asset-table">
            <div className="asset-row asset-head">
              <span>Activo</span>
              <span className="ta-r">Participaciones</span>
              <span className="ta-r">Cotización</span>
              <span className="ta-r">Valor</span>
              <span className="ta-r">Rentabilidad</span>
            </div>
            {assets.map((a) => {
              const m = assetMetrics(a)
              const tone = m.pnl >= 0 ? 'tone-positive' : 'tone-negative'
              return (
                <button type="button" key={a.id} className="asset-row" onClick={() => navigate(`/cartera/${a.id}`)}>
                  <span className="asset-name">
                    <span className="asset-title">{a.name}</span>
                    <span className="asset-sub">
                      {a.ticker} · {a.class}
                    </span>
                  </span>
                  <span className="ta-r num">{formatNumber(a.shares)}</span>
                  <span className="ta-r num">{formatCurrency(a.currentPrice)}</span>
                  <span className="ta-r num">{formatCurrency(m.marketValue)}</span>
                  <span className={`ta-r num ${tone}`}>{formatPercent(m.pnlPct)}</span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </>
  )
}
