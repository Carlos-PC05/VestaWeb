import { useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router-dom'
import { Card } from '../app/Card'
import { Button } from '../app/Button'
import { StatCard } from '../app/StatCard'
import { IconArrow, IconChevron, IconPlus, IconTrash } from '../lib/icons'
import { deleteMovement } from '../lib/api'
import type { MovimientosData } from '../app/loaders'
import { balanceNeto, monthMovements, sumGastos, sumIngresos } from '../lib/aggregate'
import { formatCurrency, formatRelativeDateTime } from '../lib/format'
import { MovementForm } from './MovementForm'
import './movimientos.css'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

/**
 * Pantalla de movimientos: navegador de mes, métricas del mes (ingresos,
 * gastos, balance), listado de movimientos de ese mes, alta con formulario
 * modal (HU-W01.01) y borrado con confirmación (HU-W01.02).
 */
export function Movimientos() {
  const { categories, movements } = useLoaderData() as MovimientosData
  const revalidator = useRevalidator()
  const now = new Date()
  // Mes mostrado actualmente; empieza en el mes en curso y se desplaza con `shift`.
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [formOpen, setFormOpen] = useState(false)

  /** Mueve el cursor `delta` meses (negativo = atrás, positivo = adelante). */
  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1)
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
  }

  /** Borra un movimiento tras confirmar, y revalida las listas y métricas. */
  async function handleDelete(id: number, description: string) {
    if (!confirm(`¿Eliminar "${description || 'este movimiento'}"?`)) return
    try {
      await deleteMovement(id)
      revalidator.revalidate()
    } catch {
      alert('No se pudo eliminar el movimiento. Comprueba el backend e inténtalo de nuevo.')
    }
  }

  const catName = new Map(categories.map((c) => [c.id, c.name]))
  const ms = monthMovements(movements, cursor.year, cursor.month).sort(
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

      <Card
        title={`${ms.length} movimientos`}
        action={
          <Button variant="primary" icon={<IconPlus />} onClick={() => setFormOpen(true)}>
            Añadir movimiento
          </Button>
        }
      >
        {ms.length === 0 ? (
          <p className="empty">No hay movimientos este mes. Añade el primero con el botón de arriba.</p>
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
                    <span className="mv-desc">{m.description || 'Sin descripción'}</span>
                    <span className="mv-meta">
                      {(m.categoryId !== null && catName.get(m.categoryId)) || 'Sin categoría'} ·{' '}
                      {formatRelativeDateTime(m.date)}
                    </span>
                  </span>
                  <span className={`mv-amount num ${income ? 'tone-positive' : 'tone-negative'}`}>
                    {formatCurrency(m.amount)}
                  </span>
                  <button
                    type="button"
                    className="row-delete"
                    aria-label={`Eliminar ${m.description || 'movimiento'}`}
                    onClick={() => handleDelete(m.id, m.description)}
                  >
                    <IconTrash />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {formOpen && <MovementForm categories={categories} onClose={() => setFormOpen(false)} />}
    </>
  )
}
