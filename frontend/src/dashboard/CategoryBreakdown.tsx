import type { CategorySlice } from '../lib/aggregate'
import { formatCurrency, formatPercent } from '../lib/format'
import { CategoryIcon, IconDots } from '../lib/icons'

interface CategoryBreakdownProps {
  slices: CategorySlice[]
  loading: boolean
}

/** Desglose de gastos por categoría del periodo (HU-W02.03, HU-W04.03). */
export function CategoryBreakdown({ slices, loading }: CategoryBreakdownProps) {
  if (loading) {
    return (
      <div className="category-breakdown">
        <h2>Gastos por categoría</h2>
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
      </div>
    )
  }

  return (
    <div className="category-breakdown">
      <h2>Gastos por categoría</h2>
      {slices.length === 0 ? (
        <p className="category-breakdown__empty">
          Sin gastos registrados en este rango todavía.
        </p>
      ) : (
        <ul className="category-breakdown__list">
          {slices.map((slice) => (
            <li key={slice.category?.id ?? 'sin-categoria'} className="category-breakdown__row">
              <span
                className="category-breakdown__icon"
                style={{ color: slice.category?.color ?? 'var(--muted)' }}
              >
                {slice.category ? (
                  <CategoryIcon icon={slice.category.icon} width={18} height={18} />
                ) : (
                  <IconDots width={18} height={18} />
                )}
              </span>
              <span className="category-breakdown__name">
                {slice.category?.name ?? 'Sin categoría'}
              </span>
              <span className="category-breakdown__bar-track">
                <span
                  className="category-breakdown__bar-fill"
                  style={{
                    transform: `scaleX(${Math.max(slice.fraction, 0.02)})`,
                    background: slice.category?.color ?? 'var(--muted)',
                  }}
                />
              </span>
              <span className="category-breakdown__percent num">
                {formatPercent(slice.fraction)}
              </span>
              <span className="category-breakdown__amount num">
                {formatCurrency(slice.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
