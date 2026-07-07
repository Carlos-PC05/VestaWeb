import { useState } from 'react'
import { RangeSelector } from '../charts/RangeSelector'
import { AreaTrend } from '../charts/AreaTrend'
import { Donut } from '../charts/Donut'
import { Card } from '../app/Card'
import { StatCard } from '../app/StatCard'
import { IconArrow } from '../lib/icons'
import { categories, movements } from '../lib/mock'
import {
  balanceNeto,
  filterMovements,
  gastosPorCategoria,
  patrimonioSeries,
  sumGastos,
  sumIngresos,
  totalCartera,
} from '../lib/aggregate'
import { formatCurrency, formatRelativeDateTime } from '../lib/format'
import type { Range } from '../lib/range'
import './dashboard.css'

const catName = new Map(categories.map((c) => [c.id, c.name]))

/**
 * Pantalla de inicio (EP-W04): patrimonio total con gráfico de tendencia,
 * métricas del periodo (ingresos/gastos/balance/capital invertido), donut de
 * gastos por categoría y los últimos movimientos registrados.
 */
export function Dashboard() {
  // Rango temporal seleccionado en el hero; controla la serie de patrimonio
  // y las métricas de ingresos/gastos/balance del periodo.
  const [range, setRange] = useState<Range>('1A')
  const ms = filterMovements(range)
  const serie = patrimonioSeries(range)
  const patrimonioActual = serie.length ? serie[serie.length - 1].v : 0
  const cartera = totalCartera()
  const ingresos = sumIngresos(ms)
  const gastos = sumGastos(ms)
  const neto = balanceNeto(ms)
  const donut = gastosPorCategoria(ms)
  const ultimos = [...movements].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8)

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
        <StatCard label="Capital invertido" value={formatCurrency(cartera.marketValue)} />
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
          <ul className="movement-list">
            {ultimos.map((m) => {
              const income = m.amount > 0
              return (
                <li key={m.id} className="movement">
                  <span className={`mv-icon ${income ? 'up' : 'down'}`}>
                    <IconArrow />
                  </span>
                  <span className="mv-main">
                    <span className="mv-desc">{m.description}</span>
                    <span className="mv-meta">
                      {catName.get(m.categoryId)} · {formatRelativeDateTime(m.date)}
                    </span>
                  </span>
                  <span className={`mv-amount num ${income ? 'tone-positive' : 'tone-negative'}`}>
                    {formatCurrency(m.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </>
  )
}
