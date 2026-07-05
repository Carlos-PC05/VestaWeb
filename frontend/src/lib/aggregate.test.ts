import { test, expect } from 'bun:test'
import { assets } from './mock'
import {
  sumIngresos,
  sumGastos,
  balanceNeto,
  assetMetrics,
  totalCartera,
  distribucionPorClase,
  gastosPorCategoria,
  filterMovements,
} from './aggregate'

const ms = [
  { id: 'a', date: '2026-07-01T00:00:00Z', amount: 1000, categoryId: 'nomina', description: '' },
  { id: 'b', date: '2026-07-02T00:00:00Z', amount: -200, categoryId: 'ocio', description: '' },
  { id: 'c', date: '2026-07-03T00:00:00Z', amount: -50, categoryId: 'ocio', description: '' },
]

test('sumas de ingresos/gastos/balance', () => {
  expect(sumIngresos(ms)).toBe(1000)
  expect(sumGastos(ms)).toBe(250)
  expect(balanceNeto(ms)).toBe(750)
})

test('gastosPorCategoria agrupa y suma en positivo', () => {
  const segs = gastosPorCategoria(ms)
  const ocio = segs.find((s) => s.label === 'Ocio')
  expect(ocio?.value).toBe(250)
})

test('assetMetrics calcula valor de mercado y P/L', () => {
  const a = assets.find((x) => x.id === 'vwce')!
  const m = assetMetrics(a)
  expect(m.marketValue).toBeCloseTo(a.shares * a.currentPrice, 6)
  expect(m.cost).toBeCloseTo(a.shares * a.avgCost, 6)
  expect(m.pnl).toBeCloseTo((a.currentPrice - a.avgCost) * a.shares, 6)
  expect(m.pnlPct).toBeCloseTo(m.pnl / m.cost, 6)
})

test('totalCartera = Σ valores de mercado', () => {
  const t = totalCartera()
  const expected = assets.reduce((acc, a) => acc + a.shares * a.currentPrice, 0)
  expect(t.marketValue).toBeCloseTo(expected, 4)
})

test('distribucionPorClase suma al valor total de la cartera', () => {
  const segs = distribucionPorClase()
  const sum = segs.reduce((acc, s) => acc + s.value, 0)
  expect(sum).toBeCloseTo(totalCartera().marketValue, 4)
})

test('filterMovements("1S") solo devuelve la última semana', () => {
  const within = filterMovements('1S')
  const cutoff = Date.now() - 8 * 86_400_000
  expect(within.every((m) => +new Date(m.date) >= cutoff)).toBe(true)
})
