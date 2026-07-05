import { useState } from 'react'
import { Card } from '../app/Card'
import { StatCard } from '../app/StatCard'
import { IconArrow, IconChevron } from '../lib/icons'
import { categories } from '../lib/mock'
import { balanceNeto, monthMovements, sumGastos, sumIngresos } from '../lib/aggregate'
import { formatCurrency, formatRelativeDateTime } from '../lib/format'
import './movimientos.css'

const catName = new Map(categories.map((c) => [c.id, c.name]))
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function Movimientos() {
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1)
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
  }

  const ms = monthMovements(cursor.year, cursor.month).sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  )
  const ingresos = sumIngresos(ms)
  const gastos = sumGastos(ms)
  const neto = balanceNeto(ms)

  return (
    <>
      <Card
        action={
          <div className="month-nav">
            <button type="button" onClick={() => shift(-1)} aria-label="Mes anterior">
              <IconChevron dir="left" />
            </button>
            <span className="month-label">
              {MONTHS[cursor.month]} {cursor.year}
            </span>
            <button type="button" onClick={() => shift(1)} aria-label="Mes siguiente">
              <IconChevron dir="right" />
            </button>
          </div>
        }
        title="Movimientos del mes"
      >
        <div className="stat-row">
          <StatCard label="Total ingresos" value={formatCurrency(ingresos)} tone="positive" />
          <StatCard label="Total gastos" value={formatCurrency(gastos)} tone="negative" />
          <StatCard
            label="Balance neto"
            value={formatCurrency(neto)}
            tone={neto >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </Card>

      <Card title={`${ms.length} movimientos`}>
        {ms.length === 0 ? (
          <p className="empty">No hay movimientos este mes.</p>
        ) : (
          <ul className="movement-list">
            {ms.map((m) => {
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
        )}
      </Card>
    </>
  )
}
