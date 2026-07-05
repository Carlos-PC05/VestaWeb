/**
 * Datos inventados deterministas para la fase de solo-frontend. Todo se genera
 * con un PRNG sembrado (mulberry32) para que las cifras sean estables entre
 * recargas. Las fechas se anclan a "hoy" para que los rangos cortos (1D/1S)
 * tengan datos recientes que mostrar.
 */
export type Category = { id: string; name: string; color: string }
export type Movement = {
  id: string
  date: string
  amount: number
  categoryId: string
  description: string
}
export type AssetClass = 'ETF' | 'Acciones' | 'Oro' | 'Cripto'
export type Asset = {
  id: string
  name: string
  ticker: string
  class: AssetClass
  shares: number
  avgCost: number
  currentPrice: number
  vol: number
}
export type AssetTx = {
  id: string
  date: string
  type: 'compra' | 'venta'
  shares: number
  price: number
  fee: number
}
export type Point = { t: number; v: number }

export const HISTORY_DAYS = 1095
const DAY = 86_400_000

/** PRNG determinista. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStr(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Epoch ms de las 00:00 de hoy (hora local). */
function todayMid(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const round2 = (n: number) => Math.round(n * 100) / 100

// --- Categorías (colores = tokens de categoría, van a los segmentos del donut) ---
export const categories: Category[] = [
  { id: 'nomina', name: 'Nómina', color: 'var(--primary)' },
  { id: 'vivienda', name: 'Vivienda', color: 'var(--cat-2)' },
  { id: 'alimentacion', name: 'Alimentación', color: 'var(--cat-3)' },
  { id: 'transporte', name: 'Transporte', color: 'var(--cat-4)' },
  { id: 'ocio', name: 'Ocio', color: 'var(--cat-5)' },
  { id: 'otros', name: 'Otros', color: 'var(--cat-6)' },
]

const EXPENSE_CATS: { id: string; base: number; desc: string[] }[] = [
  { id: 'alimentacion', base: 55, desc: ['Supermercado', 'Frutería', 'Panadería'] },
  { id: 'transporte', base: 22, desc: ['Gasolina', 'Metro', 'Taxi'] },
  { id: 'ocio', base: 38, desc: ['Cine', 'Restaurante', 'Suscripción'] },
  { id: 'otros', base: 30, desc: ['Farmacia', 'Ropa', 'Varios'] },
]

// --- Movimientos: 3 años de historia ---
function genMovements(): Movement[] {
  const rand = mulberry32(1337)
  const out: Movement[] = []
  const t0 = todayMid()
  let id = 0
  for (let d = HISTORY_DAYS - 1; d >= 0; d--) {
    const ms = t0 - d * DAY
    const date = new Date(ms)
    const iso = date.toISOString()
    if (date.getDate() === 1) {
      out.push({
        id: `m${id++}`,
        date: iso,
        amount: round2(2400 + rand() * 200),
        categoryId: 'nomina',
        description: 'Nómina mensual',
      })
      out.push({
        id: `m${id++}`,
        date: iso,
        amount: -round2(740 + rand() * 40),
        categoryId: 'vivienda',
        description: 'Alquiler',
      })
    }
    const n = rand() < 0.55 ? (rand() < 0.3 ? 2 : 1) : 0
    for (let k = 0; k < n; k++) {
      const cat = EXPENSE_CATS[Math.floor(rand() * EXPENSE_CATS.length)]
      out.push({
        id: `m${id++}`,
        date: iso,
        amount: -round2(cat.base * 0.4 + rand() * cat.base),
        categoryId: cat.id,
        description: cat.desc[Math.floor(rand() * cat.desc.length)],
      })
    }
  }
  return out
}

export const movements: Movement[] = genMovements()

// --- Activos ---
export const assets: Asset[] = [
  { id: 'vwce', name: 'Vanguard FTSE All-World', ticker: 'VWCE', class: 'ETF', shares: 120, avgCost: 98.4, currentPrice: 112.35, vol: 0.011 },
  { id: 'sxr8', name: 'iShares Core S&P 500', ticker: 'SXR8', class: 'ETF', shares: 15, avgCost: 420.1, currentPrice: 512.8, vol: 0.012 },
  { id: 'aapl', name: 'Apple Inc.', ticker: 'AAPL', class: 'Acciones', shares: 40, avgCost: 155.2, currentPrice: 214.6, vol: 0.018 },
  { id: 'msft', name: 'Microsoft Corp.', ticker: 'MSFT', class: 'Acciones', shares: 12, avgCost: 305.0, currentPrice: 448.9, vol: 0.017 },
  { id: 'gold', name: 'Oro físico (g)', ticker: 'XAU', class: 'Oro', shares: 200, avgCost: 55.3, currentPrice: 72.1, vol: 0.008 },
  { id: 'btc', name: 'Bitcoin', ticker: 'BTC', class: 'Cripto', shares: 0.35, avgCost: 41200, currentPrice: 58400, vol: 0.03 },
]

/**
 * Cotización histórica diaria de un activo: paseo aleatorio multiplicativo
 * sembrado por el id, escalado para terminar exactamente en `currentPrice`.
 */
export function priceHistory(assetId: string, days = HISTORY_DAYS): Point[] {
  const asset = assets.find((a) => a.id === assetId)
  if (!asset) return []
  const rand = mulberry32(hashStr(assetId))
  const logs: number[] = []
  let logp = 0
  for (let i = 0; i < days; i++) {
    logp += (rand() - 0.5) * asset.vol
    logs.push(logp)
  }
  const last = logs[logs.length - 1]
  const t0 = todayMid() - (days - 1) * DAY
  return logs.map((s, i) => ({ t: t0 + i * DAY, v: asset.currentPrice * Math.exp(s - last) }))
}

/** Valor diario de la cartera = Σ (shares · cotización) alineado por día. */
export function portfolioValueSeries(days = HISTORY_DAYS): Point[] {
  const series = assets.map((a) => ({ shares: a.shares, hist: priceHistory(a.id, days) }))
  const out: Point[] = []
  for (let i = 0; i < days; i++) {
    let v = 0
    for (const s of series) v += s.shares * s.hist[i].v
    out.push({ t: series[0].hist[i].t, v })
  }
  return out
}

/** Historial de transacciones registradas de un activo. */
export function assetTransactions(assetId: string): AssetTx[] {
  const asset = assets.find((a) => a.id === assetId)
  if (!asset) return []
  const rand = mulberry32(hashStr(assetId) ^ 0x9e3779b9)
  const t0 = todayMid()
  const nBuys = 2 + Math.floor(rand() * 3)
  const txs: AssetTx[] = []
  for (let i = 0; i < nBuys; i++) {
    const daysAgo = Math.floor(rand() * HISTORY_DAYS)
    txs.push({
      id: `${assetId}-tx${i}`,
      date: new Date(t0 - daysAgo * DAY).toISOString(),
      type: rand() < 0.85 ? 'compra' : 'venta',
      shares: round2((asset.shares / nBuys) * (0.5 + rand())),
      price: round2(asset.avgCost * (0.85 + rand() * 0.4)),
      fee: round2(1 + rand() * 4),
    })
  }
  return txs.sort((a, b) => +new Date(b.date) - +new Date(a.date))
}
