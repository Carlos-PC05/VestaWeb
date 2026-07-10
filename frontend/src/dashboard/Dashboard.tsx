import { useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { RangeSelector } from '../charts/RangeSelector'
import { AreaTrend } from '../charts/AreaTrend'
import { Donut } from '../charts/Donut'
import { Card } from '../app/Card'
import { StatCard } from '../app/StatCard'
import { IconArrow } from '../lib/icons'
import type { DashboardData } from '../app/loaders'
import {
  balanceNeto,
  filterMovements,
  gastosPorCategoria,
  patrimonioSeries,
  sumGastos,
  sumIngresos,
  totalCartera,
} from '../lib/aggregate'
import { formatCurrency, formatPercent, formatRelativeDateTime } from '../lib/format'
import type { Range } from '../lib/range'
import './dashboard.css'

/**
 * Pantalla de inicio (EP-W04): patrimonio total con gráfico de tendencia,
 * métricas del periodo (ingresos/gastos/balance/valor de cartera), donut de
 * gastos por categoría y los últimos movimientos registrados.
 */
export function Dashboard() {
  const { categories, movements, assets, txsByAsset } = useLoaderData() as DashboardData
  // Rango temporal seleccionado en el hero; controla la serie de patrimonio
  // y las métricas de ingresos/gastos/balance del periodo.
  const [range, setRange] = useState<Range>('1A')

  const catName = new Map(categories.map((c) => [c.id, c.name]))
  const ms = filterMovements(movements, range)
  const serie = patrimonioSeries(movements, assets, txsByAsset, range)
  const cartera = totalCartera(assets, txsByAsset)
  const patrimonioActual = serie.length
    ? serie[serie.length - 1].v
    : balanceNeto(movements) + cartera.marketValue
  const ingresos = sumIngresos(ms)
  const gastos = sumGastos(ms)
  const neto = balanceNeto(ms)
  const donut = gastosPorCategoria(ms, categories)
  const ultimos = [...movements]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 8)

  return (
    <>
      <Card
        title="Patrimonio total"
        action={<RangeSelector value={range} onChange={setRange} />}
        className="hero-card"
      >
        <p className="hero-figure num">{formatCurrency(patrimonioActual)}</p>
        <AreaTrend data={serie} height={320} />
      </Card>

      <div className="stat-row">
        <StatCard
          label="Valor de cartera"
          value={formatCurrency(cartera.marketValue)}
          sub={
            cartera.cost > 0
              ? `${cartera.pnl >= 0 ? '+' : ''}${formatCurrency(cartera.pnl)} (${formatPercent(cartera.pnlPct)})`
              : undefined
          }
          tone={cartera.pnl > 0 ? 'positive' : cartera.pnl < 0 ? 'negative' : 'neutral'}
        />
        <StatCard label={`Ingresos · ${range}`} value={formatCurrency(ingresos)} tone="positive" />
        <StatCard label={`Gastos · ${range}`} value={formatCurrency(gastos)} tone="negative" />
        <StatCard
          label={`Balance neto · ${range}`}
          value={formatCurrency(neto)}
          tone={neto >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="dash-lower">
        <Card title="Gastos por categoría">
          <Donut data={donut} />
        </Card>

        <Card title="Últimos movimientos">
          {ultimos.length === 0 ? (
            <p className="empty">
              Aún no hay movimientos. Regístralos desde la pantalla de Movimientos.
            </p>
          ) : (
            <ul className="movement-list">
              {ultimos.map((m) => {
                const income = m.amount > 0
                return (
                  <li key={m.id} className="movement">
                    <span className={`mv-icon ${income ? 'up' : 'down'}`}>
                      <IconArrow />
                    </span>
                    <span className="mv-main">
                      <span className="mv-desc">{m.description || 'Sin descripción'}</span>
                      <span className="mv-meta">
                        {(m.categoryId !== null && catName.get(m.categoryId)) || 'Sin categoría'} ·{' '}
                        {formatRelativeDateTime(m.date)}
                      </span>
                    </span>
                    <span className={`mv-amount num ${income ? 'tone-positive' : 'tone-negative'}`}>
                      {formatCurrency(m.amount)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
