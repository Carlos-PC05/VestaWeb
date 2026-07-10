import { test, expect } from 'bun:test'
import type { Asset, AssetTx, Category, Movement } from './api'
import {
  sumIngresos,
  sumGastos,
  balanceNeto,
  gastosPorCategoria,
  filterMovements,
  monthMovements,
  filterPoints,
  positionFromTxs,
  assetMetrics,
  totalCartera,
  distribucionPorClase,
  carteraSeries,
  patrimonioSeries,
  positionValueSeries,
} from './aggregate'

const DAY = 86_400_000

const cats: Category[] = [
  { id: 1, name: 'Nómina', icon: 'wallet', color: '#22C55E', type: 'ingreso' },
  { id: 2, name: 'Ocio', icon: 'film', color: '#A855F7', type: 'gasto' },
]

const ms: Movement[] = [
  { id: 1, date: '2026-07-01T00:00:00Z', amount: 1000, categoryId: 1, description: '' },
  { id: 2, date: '2026-07-02T00:00:00Z', amount: -200, categoryId: 2, description: '' },
  { id: 3, date: '2026-07-03T00:00:00Z', amount: -50, categoryId: 2, description: '' },
  { id: 4, date: '2026-06-15T00:00:00Z', amount: -30, categoryId: null, description: '' },
]

const etf: Asset = {
  id: 1,
  naturaleza: 'cotizado',
  class: 'etf',
  name: 'VWCE',
  currency: 'EUR',
  ticker: 'VWCE',
  currentPrice: 110,
  manualValue: null,
  valuedAt: null,
}

const piso: Asset = {
  id: 2,
  naturaleza: 'no cotizado',
  class: 'inmueble',
  name: 'Piso',
  currency: 'EUR',
  ticker: null,
  currentPrice: null,
  manualValue: 180000,
  valuedAt: '2026-06-01T00:00:00Z',
}

const tx = (over: Partial<AssetTx>): AssetTx => ({
  id: 0,
  assetId: 1,
  type: 'compra',
  shares: 1,
  unitPrice: 100,
  fee: 0,
  date: '2026-01-10T00:00:00Z',
  ...over,
})

test('sumas de ingresos/gastos/balance', () => {
  expect(sumIngresos(ms)).toBe(1000)
  expect(sumGastos(ms)).toBe(280)
  expect(balanceNeto(ms)).toBe(720)
})

test('gastosPorCategoria agrupa, suma en positivo y etiqueta "Sin categoría"', () => {
  const segs = gastosPorCategoria(ms, cats)
  expect(segs.find((s) => s.label === 'Ocio')?.value).toBe(250)
  expect(segs.find((s) => s.label === 'Sin categoría')?.value).toBe(30)
  // Ordenado de mayor a menor.
  expect(segs[0].value).toBeGreaterThanOrEqual(segs[segs.length - 1].value)
})

test('monthMovements filtra por año y mes', () => {
  expect(monthMovements(ms, 2026, 6).length).toBe(3) // julio (mes base 0 = 6)
  expect(monthMovements(ms, 2026, 5).length).toBe(1)
})

test('filterMovements recorta por rango temporal', () => {
  const recent: Movement[] = [
    { id: 1, date: new Date(Date.now() - 2 * DAY).toISOString(), amount: 5, categoryId: null, description: '' },
    { id: 2, date: new Date(Date.now() - 40 * DAY).toISOString(), amount: 5, categoryId: null, description: '' },
  ]
  expect(filterMovements(recent, '1S').length).toBe(1)
  expect(filterMovements(recent, 'Todo').length).toBe(2)
})

test('positionFromTxs: coste medio con compras y ventas', () => {
  const txs = [
    tx({ shares: 10, unitPrice: 100, fee: 5 }), // coste 1005
    tx({ shares: 10, unitPrice: 120, fee: 5, date: '2026-02-10T00:00:00Z' }), // coste 1205
    tx({ type: 'venta', shares: 5, unitPrice: 130, date: '2026-03-10T00:00:00Z' }),
  ]
  const p = positionFromTxs(txs)
  expect(p.shares).toBe(15)
  // Coste medio tras compras: 2210 / 20 = 110.5; la venta no cambia el medio.
  expect(p.avgCost).toBeCloseTo(110.5, 6)
  expect(p.cost).toBeCloseTo(15 * 110.5, 6)
})

test('assetMetrics cotizado: valor de mercado con precio actual', () => {
  const txs = [tx({ shares: 10, unitPrice: 100 })]
  const m = assetMetrics(etf, txs)
  expect(m.marketValue).toBe(1100)
  expect(m.cost).toBe(1000)
  expect(m.pnl).toBe(100)
  expect(m.pnlPct).toBeCloseTo(0.1, 6)
})

test('assetMetrics no cotizado: valor manual; sin coste conocido, P/L 0', () => {
  const m = assetMetrics(piso, [])
  expect(m.marketValue).toBe(180000)
  expect(m.pnl).toBe(0)
})

test('totalCartera y distribucionPorClase suman lo mismo', () => {
  const txsByAsset = new Map([[etf.id, [tx({ shares: 10, unitPrice: 100 })]]])
  const total = totalCartera([etf, piso], txsByAsset)
  expect(total.marketValue).toBe(1100 + 180000)
  const segs = distribucionPorClase([etf, piso], txsByAsset)
  expect(segs.reduce((a, s) => a + s.value, 0)).toBeCloseTo(total.marketValue, 6)
  expect(segs[0].label).toBe('Inmueble')
})

test('carteraSeries: valor diario = participaciones acumuladas × precio actual', () => {
  const t0 = new Date(Date.now() - 9 * DAY)
  const txs = [
    tx({ shares: 10, unitPrice: 100, date: t0.toISOString() }),
    tx({ shares: 10, unitPrice: 105, date: new Date(Date.now() - 4 * DAY).toISOString() }),
  ]
  const serie = carteraSeries([etf], new Map([[etf.id, txs]]), 'Todo')
  expect(serie.length).toBe(10)
  expect(serie[0].v).toBe(10 * 110) // tras la primera compra
  expect(serie[serie.length - 1].v).toBe(20 * 110)
})

test('patrimonioSeries: último punto = liquidez total + valor de cartera', () => {
  const recent: Movement[] = [
    { id: 1, date: new Date(Date.now() - 5 * DAY).toISOString(), amount: 3000, categoryId: 1, description: '' },
    { id: 2, date: new Date(Date.now() - 1 * DAY).toISOString(), amount: -500, categoryId: 2, description: '' },
  ]
  const txs = [tx({ shares: 10, unitPrice: 100, date: new Date(Date.now() - 3 * DAY).toISOString() })]
  const serie = patrimonioSeries(recent, [etf], new Map([[etf.id, txs]]), 'Todo')
  expect(serie[serie.length - 1].v).toBeCloseTo(2500 + 1100, 6)
  // La serie es creciente en el tiempo (t) y arranca en el primer dato.
  expect(serie[0].t).toBeLessThan(serie[serie.length - 1].t)
})

test('patrimonioSeries sin datos devuelve serie vacía', () => {
  expect(patrimonioSeries([], [], new Map(), 'Todo')).toEqual([])
})

test('positionValueSeries de un cotizado sigue las participaciones', () => {
  const txs = [
    tx({ shares: 10, unitPrice: 100, date: new Date(Date.now() - 6 * DAY).toISOString() }),
    tx({ type: 'venta', shares: 4, unitPrice: 120, date: new Date(Date.now() - 2 * DAY).toISOString() }),
  ]
  const serie = positionValueSeries(etf, txs, 'Todo')
  expect(serie[0].v).toBe(10 * 110)
  expect(serie[serie.length - 1].v).toBe(6 * 110)
})

test('filterPoints recorta por rango', () => {
  const pts = [
    { t: Date.now() - 100 * DAY, v: 1 },
    { t: Date.now() - 2 * DAY, v: 2 },
  ]
  expect(filterPoints(pts, '1M').length).toBe(1)
  expect(filterPoints(pts, 'Todo').length).toBe(2)
})
