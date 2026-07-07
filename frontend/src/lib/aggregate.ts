/**
 * Agregación cliente sobre los datos mock: sumas de movimientos, series
 * temporales (patrimonio, capital invertido), desgloses (donut) y métricas
 * de cartera. Todo derivado — sin estado propio.
 */
import {
  assets,
  categories,
  movements,
  portfolioValueSeries,
  type Asset,
  type Movement,
  type Point,
} from './mock'
import { rangeStart, type Range } from './range'

/** Segmento de un desglose (donut de gastos, distribución por clase de activo). */
export type Segment = { label: string; value: number; color: string }
/** Métricas de valoración: valor de mercado, coste, plusvalía/minusvalía y su porcentaje. */
export type Metrics = { marketValue: number; cost: number; pnl: number; pnlPct: number }

const catById = new Map(categories.map((c) => [c.id, c]))

/**
 * Movimientos dentro de la ventana del rango, contados hacia atrás desde ahora.
 *
 * @param range - Rango temporal seleccionado en la UI.
 * @returns Movimientos con fecha dentro de la ventana del rango.
 */
export function filterMovements(range: Range): Movement[] {
  const start = rangeStart(range)
  return movements.filter((m) => +new Date(m.date) >= start)
}

/**
 * Recorta una serie de puntos a la ventana del rango.
 *
 * @param points - Serie temporal completa a recortar.
 * @param range - Rango temporal seleccionado en la UI.
 * @returns Subconjunto de `points` dentro de la ventana del rango.
 */
export function filterPoints(points: Point[], range: Range): Point[] {
  const start = rangeStart(range)
  return points.filter((p) => p.t >= start)
}

/**
 * Movimientos de un mes concreto, usado por el navegador de mes de Movimientos.
 *
 * @param year - Año completo (p. ej. 2026).
 * @param month - Mes en base 0 (0 = enero).
 * @returns Movimientos cuya fecha cae en ese año/mes.
 */
export function monthMovements(year: number, month: number): Movement[] {
  return movements.filter((m) => {
    const d = new Date(m.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
}

/** Suma de importes positivos (ingresos) de una lista de movimientos. */
export const sumIngresos = (ms: Movement[]): number =>
  ms.reduce((acc, m) => (m.amount > 0 ? acc + m.amount : acc), 0)

/** Suma de importes negativos (gastos), devuelta en positivo. */
export const sumGastos = (ms: Movement[]): number =>
  ms.reduce((acc, m) => (m.amount < 0 ? acc - m.amount : acc), 0)

/** Balance neto (ingresos − gastos) de una lista de movimientos. */
export const balanceNeto = (ms: Movement[]): number =>
  ms.reduce((acc, m) => acc + m.amount, 0)

/**
 * Gasto agrupado por categoría (valores positivos), ordenado de mayor a menor,
 * para alimentar el donut de gastos del dashboard.
 *
 * @param ms - Movimientos a agrupar (los ingresos se ignoran).
 * @returns Un segmento por categoría con gasto, ordenado descendente.
 */
export function gastosPorCategoria(ms: Movement[]): Segment[] {
  const totals = new Map<string, number>()
  for (const m of ms) {
    if (m.amount >= 0) continue
    totals.set(m.categoryId, (totals.get(m.categoryId) ?? 0) - m.amount)
  }
  return [...totals.entries()]
    .map(([id, value]) => ({
      label: catById.get(id)?.name ?? id,
      value,
      color: catById.get(id)?.color ?? 'var(--cat-6)',
    }))
    .sort((a, b) => b.value - a.value)
}

const CLASS_COLOR: Record<string, string> = {
  ETF: 'var(--cat-1)',
  Acciones: 'var(--cat-2)',
  Oro: 'var(--cat-4)',
  Cripto: 'var(--cat-5)',
}

/**
 * Distribución del valor de mercado actual de la cartera por clase de activo
 * (ETF, Acciones, Oro, Cripto), ordenada de mayor a menor.
 *
 * @returns Un segmento por clase de activo presente en la cartera.
 */
export function distribucionPorClase(): Segment[] {
  const totals = new Map<string, number>()
  for (const a of assets) {
    totals.set(a.class, (totals.get(a.class) ?? 0) + a.shares * a.currentPrice)
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value, color: CLASS_COLOR[label] ?? 'var(--cat-6)' }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Patrimonio total a lo largo del tiempo = liquidez acumulada (Σ movimientos
 * hasta cada día) + valor de la cartera ese día. Alineado por día con la
 * serie de cartera; recortado al rango.
 *
 * @param range - Rango temporal a devolver.
 * @returns Serie de patrimonio total, un punto por día, dentro del rango.
 */
export function patrimonioSeries(range: Range): Point[] {
  const cartera = portfolioValueSeries()
  // Liquidez acumulada por día: suma de movimientos con fecha <= día.
  const sorted = [...movements].sort((a, b) => +new Date(a.date) - +new Date(b.date))
  let idx = 0
  let liquidez = 0
  const out: Point[] = cartera.map((p) => {
    while (idx < sorted.length && +new Date(sorted[idx].date) <= p.t + 86_400_000 - 1) {
      liquidez += sorted[idx].amount
      idx++
    }
    return { t: p.t, v: liquidez + p.v }
  })
  return filterPoints(out, range)
}

/**
 * Evolución del valor de mercado de la cartera, recortada al rango.
 *
 * @param range - Rango temporal a devolver.
 * @returns Serie de valor de cartera, un punto por día, dentro del rango.
 */
export function capitalInvertidoSeries(range: Range): Point[] {
  return filterPoints(portfolioValueSeries(), range)
}

/**
 * Calcula valor de mercado, coste y plusvalía/minusvalía de un activo.
 *
 * @param asset - Activo sobre el que calcular las métricas.
 * @returns Métricas de valoración del activo (0 en `pnlPct` si el coste es 0).
 */
export function assetMetrics(asset: Asset): Metrics {
  const marketValue = asset.shares * asset.currentPrice
  const cost = asset.shares * asset.avgCost
  const pnl = marketValue - cost
  return { marketValue, cost, pnl, pnlPct: cost === 0 ? 0 : pnl / cost }
}

/**
 * Métricas agregadas de toda la cartera, sumando `assetMetrics` de cada activo.
 *
 * @returns Métricas de valoración de la cartera completa.
 */
export function totalCartera(): Metrics {
  const acc = assets.reduce(
    (a, asset) => {
      const m = assetMetrics(asset)
      a.marketValue += m.marketValue
      a.cost += m.cost
      return a
    },
    { marketValue: 0, cost: 0 },
  )
  const pnl = acc.marketValue - acc.cost
  return { ...acc, pnl, pnlPct: acc.cost === 0 ? 0 : pnl / acc.cost }
}
