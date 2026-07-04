import { Link } from 'react-router-dom'
import type { Category, Transaction } from '../lib/api'
import { formatCurrency, formatRelativeDateTime } from '../lib/format'
import { CategoryIcon, IconChevronRight } from '../lib/icons'

interface RecentMovementsProps {
  transactions: Transaction[]
  categories: Category[]
  loading?: boolean
  limit?: number
}

/** Lista de los últimos movimientos del dashboard, con enlace a la pantalla completa. */
export function RecentMovements({ transactions, categories, loading, limit = 5 }: RecentMovementsProps) {
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const recent = [...transactions]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, limit)

  return (
    <section className="card recent">
      <header className="card__header">
        <h2>Últimos movimientos</h2>
        <Link to="/movimientos" className="card__link">
          Ver todos
          <IconChevronRight width={14} height={14} aria-hidden="true" />
        </Link>
      </header>

      {loading ? (
        <div className="recent__list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-line skeleton-line--row" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="card__empty">Sin movimientos registrados todavía.</p>
      ) : (
        <ul className="recent__list">
          {recent.map((t) => {
            const category = t.category_id !== null ? categoryById.get(t.category_id) : undefined
            const isIncome = t.type === 'ingreso'
            return (
              <li key={t.id} className="recent__item">
                <span
                  className="recent__icon"
                  style={{ color: category?.color ?? 'var(--muted)' }}
                >
                  <CategoryIcon icon={category?.icon ?? 'ellipsis'} width={18} height={18} />
                </span>
                <div className="recent__body">
                  <span className="recent__name">
                    {t.description || category?.name || 'Movimiento'}
                  </span>
                  <span className="recent__date">{formatRelativeDateTime(t.occurred_at)}</span>
                </div>
                <span className="recent__amount num" data-tone={isIncome ? 'positive' : 'negative'}>
                  {isIncome ? '+' : '−'}
                  {formatCurrency(Number(t.amount))}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
