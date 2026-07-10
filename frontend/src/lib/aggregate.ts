/**
 * Agregación pura sobre los datos reales del API: sumas de movimientos,
 * posiciones de cartera derivadas de las operaciones, series temporales
 * (patrimonio, valor de cartera) y desgloses para los donuts. Sin estado
 * propio: cada función recibe los datos y devuelve el derivado.
 *
 * Nota sobre las series: no existe histórico de cotizaciones en el backend,
 * así que el valor pasado de la cartera se aproxima valorando las
 * participaciones que se tenían cada día al precio actual del activo
 * (ponytail: aproximación estándar sin histórico; cambiar cuando exista un
 * endpoint de cotizaciones históricas).
 */
import { CLASS_LABEL, type Asset, type AssetTx, type Category, type Movement, type Point } from './api'
import { rangeStart, type Range } from './range'

/** Segmento de un desglose (donut de gastos, distribución por clase de activo). */
export type Segment = { label: string; value: number; color: string }

/** Métricas de valoración de una posición o de la cartera completa. */
export type Metrics = {
  marketValue: number
  cost: number
  pnl: number
  pnlPct: number
}

/** Posición derivada de las operaciones de un activo (método de coste medio). */
export type Position = { shares: number; avgCost: number; cost: number }

const DAY = 86_400_000

// --- Movimientos ---

/** Movimientos con fecha dentro de la ventana del rango, hacia atrás desde ahora. */
export function filterMovements(ms: Movement[], range: Range): Movement[] {
  const start = rangeStart(range)
  return ms.filter((m) => +new Date(m.date) >= start)
}

/** Movimientos de un mes concreto (`month` en base 0). */
export function monthMovements(ms: Movement[], year: number, month: number): Movement[] {
  return ms.filter((m) => {
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
export const balanceNeto = (ms: Movement[]): number => ms.reduce((acc, m) => acc + m.amount, 0)

/**
 * Gasto agrupado por categoría (valores positivos), ordenado de mayor a menor.
 * Los movimientos sin categoría (borrada o nunca asignada) se agrupan bajo
 * "Sin categoría".
 */
export function gastosPorCategoria(ms: Movement[], categories: Category[]): Segment[] {
  const catById = new Map(categories.map((c) => [c.id, c]))
  const totals = new Map<number | null, number>()
  for (const m of ms) {
    if (m.amount >= 0) continue
    const key = m.categoryId !== null && catById.has(m.categoryId) ? m.categoryId : null
    totals.set(key, (totals.get(key) ?? 0) - m.amount)
  }
  return [...totals.entries()]
    .map(([id, value]) => ({
      label: id === null ? 'Sin categoría' : catById.get(id)!.name,
      value,
      color: id === null ? 'var(--cat-6)' : catById.get(id)!.color,
    }))
    .sort((a, b) => b.value - a.value)
}

// --- Posiciones y métricas de cartera ---

/**
 * Posición resultante de una lista de operaciones, por el método de coste
 * medio: cada compra incorpora su comisión al coste; una venta reduce
 * participaciones y coste proporcionalmente sin alterar el precio medio.
 */
export function positionFromTxs(txs: AssetTx[]): Position {
  const sorted = [...txs].sort((a, b) => +new Date(a.date) - +new Date(b.date))
  let shares = 0
  let cost = 0
  for (const t of sorted) {
    if (t.type === 'compra') {
      shares += t.shares
      cost += t.shares * t.unitPrice + t.fee
    } else if (shares > 0) {
      const avg = cost / shares
      const sold = Math.min(t.shares, shares)
      shares -= sold
      cost -= sold * avg
    }
  }
  return { shares, avgCost: shares > 0 ? cost / shares : 0, cost }
}

/** Valor unitario con el que se valora un activo: cotización o valoración manual. */
const unitValue = (a: Asset): number => a.currentPrice ?? 0

/**
 * Métricas de valoración de un activo con sus operaciones.
 * Cotizado: participaciones × cotización frente a su coste medio.
 * No cotizado: la valoración manual es el valor de mercado; si no hay
 * operaciones que den un coste, el P/L se considera 0.
 */
export function assetMetrics(asset: Asset, txs: AssetTx[]): Metrics & Position {
  const pos = positionFromTxs(txs)
  const marketValue =
    asset.naturaleza === 'cotizado' ? pos.shares * unitValue(asset) : (asset.manualValue ?? 0)
  const cost = asset.naturaleza === 'cotizado' || txs.length > 0 ? pos.cost : marketValue
  const pnl = marketValue - cost
  return { ...pos, marketValue, cost, pnl, pnlPct: cost === 0 ? 0 : pnl / cost }
}

/** Métricas agregadas de toda la cartera. */
export function totalCartera(assets: Asset[], txsByAsset: Map<number, AssetTx[]>): Metrics {
  const acc = assets.reduce(
    (a, asset) => {
      const m = assetMetrics(asset, txsByAsset.get(asset.id) ?? [])
      a.marketValue += m.marketValue
      a.cost += m.cost
      return a
    },
    { marketValue: 0, cost: 0 },
  )
  const pnl = acc.marketValue - acc.cost
  return { ...acc, pnl, pnlPct: acc.cost === 0 ? 0 : pnl / acc.cost }
}

/** Colores de las clases de activo (tokens de categoría del design system). */
const CLASS_COLOR: Record<string, string> = {
  etf: 'var(--cat-1)',
  accion: 'var(--cat-2)',
  inmueble: 'var(--cat-3)',
  oro: 'var(--cat-4)',
  cripto: 'var(--cat-5)',
}

/**
 * Distribución del valor de mercado actual de la cartera por clase de
 * activo, ordenada de mayor a menor. Las clases sin valor se omiten.
 */
export function distribucionPorClase(
  assets: Asset[],
  txsByAsset: Map<number, AssetTx[]>,
): Segment[] {
  const totals = new Map<string, number>()
  for (const a of assets) {
    const mv = assetMetrics(a, txsByAsset.get(a.id) ?? []).marketValue
    if (mv <= 0) continue
    totals.set(a.class, (totals.get(a.class) ?? 0) + mv)
  }
  return [...totals.entries()]
    .map(([cls, value]) => ({
      label: CLASS_LABEL[cls as keyof typeof CLASS_LABEL] ?? cls,
      value,
      color: CLASS_COLOR[cls] ?? 'var(--cat-6)',
    }))
    .sort((a, b) => b.value - a.value)
}

// --- Series temporales ---

/** Epoch ms de las 00:00 (hora local) del día que contiene `ms`. */
function midnight(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Días (00:00 local) desde `from` hasta hoy, ambos incluidos. */
function daysFrom(from: number): number[] {
  const out: number[] = []
  const end = midnight(Date.now())
  for (let t = midnight(from); t <= end; t += DAY) out.push(t)
  return out
}

/**
 * Valor de la cartera para cada día de `days`: por activo cotizado, las
 * participaciones acumuladas hasta ese día × su precio actual; por activo no
 * cotizado, su valoración manual (plana: no hay histórico de tasaciones).
 */
function holdingsValueByDay(
  assets: Asset[],
  txsByAsset: Map<number, AssetTx[]>,
  days: number[],
): number[] {
  const values = new Array<number>(days.length).fill(0)
  for (const asset of assets) {
    if (asset.naturaleza === 'no cotizado') {
      const mv = asset.manualValue ?? 0
      for (let i = 0; i < days.length; i++) values[i] += mv
      continue
    }
    const txs = [...(txsByAsset.get(asset.id) ?? [])].sort(
      (a, b) => +new Date(a.date) - +new Date(b.date),
    )
    const price = unitValue(asset)
    let shares = 0
    let idx = 0
    for (let i = 0; i < days.length; i++) {
      const dayEnd = days[i] + DAY - 1
      while (idx < txs.length && +new Date(txs[idx].date) <= dayEnd) {
        shares += txs[idx].type === 'compra' ? txs[idx].shares : -txs[idx].shares
        idx++
      }
      values[i] += shares * price
    }
  }
  return values
}

/** Fecha (epoch ms) del dato más antiguo entre movimientos y operaciones. */
function earliest(ms: Movement[], txsByAsset: Map<number, AssetTx[]>): number | null {
  let min = Infinity
  for (const m of ms) min = Math.min(min, +new Date(m.date))
  for (const txs of txsByAsset.values())
    for (const t of txs) min = Math.min(min, +new Date(t.date))
  return min === Infinity ? null : min
}

/**
 * Evolución del valor de mercado de la cartera, un punto por día desde la
 * primera operación, recortada al rango.
 */
export function carteraSeries(
  assets: Asset[],
  txsByAsset: Map<number, AssetTx[]>,
  range: Range,
): Point[] {
  const from = earliest([], txsByAsset)
  if (from === null) return []
  const days = daysFrom(from)
  const values = holdingsValueByDay(assets, txsByAsset, days)
  return filterPoints(
    days.map((t, i) => ({ t, v: values[i] })),
    range,
  )
}

/**
 * Patrimonio total a lo largo del tiempo = liquidez acumulada (Σ movimientos
 * hasta cada día) + valor de la cartera ese día. Un punto por día desde el
 * primer dato registrado, recortado al rango.
 */
export function patrimonioSeries(
  ms: Movement[],
  assets: Asset[],
  txsByAsset: Map<number, AssetTx[]>,
  range: Range,
): Point[] {
  const from = earliest(ms, txsByAsset)
  if (from === null) return []
  const days = daysFrom(from)
  const holdings = holdingsValueByDay(assets, txsByAsset, days)

  const sorted = [...ms].sort((a, b) => +new Date(a.date) - +new Date(b.date))
  let idx = 0
  let liquidez = 0
  const out = days.map((t, i) => {
    while (idx < sorted.length && +new Date(sorted[idx].date) <= t + DAY - 1) {
      liquidez += sorted[idx].amount
      idx++
    }
    return { t, v: liquidez + holdings[i] }
  })
  return filterPoints(out, range)
}

/**
 * Evolución del valor de la posición de un único activo (participaciones
 * acumuladas × precio actual; valoración manual plana si no cotiza).
 */
export function positionValueSeries(asset: Asset, txs: AssetTx[], range: Range): Point[] {
  const txsByAsset = new Map([[asset.id, txs]])
  const from = earliest([], txsByAsset) ?? +new Date(asset.valuedAt ?? Date.now())
  const days = daysFrom(from)
  const values = holdingsValueByDay([asset], txsByAsset, days)
  return filterPoints(
    days.map((t, i) => ({ t, v: values[i] })),
    range,
  )
}

/** Recorta una serie de puntos a la ventana del rango. */
export function filterPoints(points: Point[], range: Range): Point[] {
  const start = rangeStart(range)
  return points.filter((p) => p.t >= start)
}
