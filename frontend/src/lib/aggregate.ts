import type { Category, Transaction } from './api'
import { formatDayLabel, formatMonthLabel } from './format'

export type DashboardRange = '1M' | '3M' | '6M' | '1A'

export const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1A', label: '1A' },
]

const RANGE_MONTHS: Record<DashboardRange, number> = { '1M': 1, '3M': 3, '6M': 6, '1A': 12 }

/** Importe con signo: positivo si es ingreso, negativo si es gasto. */
const signedAmount = (t: Transaction): number =>
  (t.type === 'ingreso' ? 1 : -1) * Number(t.amount)

/** Primer instante del rango seleccionado, contando hacia atrás desde hoy. */
export function rangeStart(range: DashboardRange, from: Date = new Date()): Date {
  const start = new Date(from)
  start.setMonth(start.getMonth() - RANGE_MONTHS[range])
  return start
}

/**
 * Suma el neto (ingresos − gastos) de todos los movimientos, sin acotar por
 * fecha. Es el proxy de "patrimonio total" mientras EP-W03 (cartera) no
 * existe: no hay activos que sumar, solo el histórico de movimientos.
 */
export function totalBalance(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + signedAmount(t), 0)
}

/** Ingresos, gastos y neto dentro del rango seleccionado. */
export function periodTotals(transactions: Transaction[], range: DashboardRange) {
  const start = rangeStart(range)
  const inRange = transactions.filter((t) => new Date(t.occurred_at) >= start)
  const income = inRange
    .filter((t) => t.type === 'ingreso')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const expense = inRange
    .filter((t) => t.type === 'gasto')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  return { income, expense, net: income - expense }
}

export interface SeriesPoint {
  label: string
  date: Date
  balance: number
}

/**
 * Construye la serie de saldo acumulado para el gráfico de evolución
 * (HU-W04.02). Cada punto es el saldo acumulado de TODOS los movimientos
 * hasta esa fecha (no solo los del rango), para que la línea represente la
 * trayectoria real del patrimonio y no arranque artificialmente en cero.
 * 1M se cubre en buckets diarios; 3M/6M/1A en buckets mensuales.
 */
export function buildBalanceSeries(
  transactions: Transaction[],
  range: DashboardRange,
): SeriesPoint[] {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime(),
  )
  const start = rangeStart(range)
  const now = new Date()

  const bucketDates: Date[] = []
  if (range === '1M') {
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      bucketDates.push(new Date(d))
    }
  } else {
    for (let d = new Date(start); d <= now; d.setMonth(d.getMonth() + 1)) {
      bucketDates.push(new Date(d))
    }
    bucketDates.push(now)
  }

  return bucketDates.map((bucketEnd) => {
    const balance = sorted
      .filter((t) => new Date(t.occurred_at) <= bucketEnd)
      .reduce((sum, t) => sum + signedAmount(t), 0)
    return {
      date: bucketEnd,
      balance,
      label: range === '1M' ? formatDayLabel(bucketEnd) : formatMonthLabel(bucketEnd),
    }
  })
}

export interface CategorySlice {
  category: Category | null
  amount: number
  fraction: number
}

/**
 * Desglose de gastos por categoría dentro del rango (HU-W02.03, HU-W04.03),
 * ordenado de mayor a menor importe. Los movimientos sin categoría (borrada
 * o nunca asignada) se agrupan bajo `category: null`.
 */
export function categoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  range: DashboardRange,
): CategorySlice[] {
  const start = rangeStart(range)
  const byCategory = new Map<number | null, number>()

  for (const t of transactions) {
    if (t.type !== 'gasto' || new Date(t.occurred_at) < start) continue
    byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + Number(t.amount))
  }

  const total = [...byCategory.values()].reduce((sum, v) => sum + v, 0)
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  return [...byCategory.entries()]
    .map(([categoryId, amount]) => ({
      category: categoryId === null ? null : (categoryById.get(categoryId) ?? null),
      amount,
      fraction: total > 0 ? amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}
