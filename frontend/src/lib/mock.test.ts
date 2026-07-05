import { test, expect } from 'bun:test'
import {
  categories,
  movements,
  assets,
  priceHistory,
  portfolioValueSeries,
  assetTransactions,
  HISTORY_DAYS,
} from './mock'

test('categorías y activos no vacíos', () => {
  expect(categories.length).toBeGreaterThan(0)
  expect(assets.length).toBeGreaterThan(0)
})

test('todo movimiento referencia una categoría válida', () => {
  const ids = new Set(categories.map((c) => c.id))
  for (const m of movements) expect(ids.has(m.categoryId)).toBe(true)
})

test('hay ingresos y gastos', () => {
  expect(movements.some((m) => m.amount > 0)).toBe(true)
  expect(movements.some((m) => m.amount < 0)).toBe(true)
})

test('priceHistory termina en el precio actual y tiene HISTORY_DAYS puntos', () => {
  const a = assets[0]
  const h = priceHistory(a.id)
  expect(h.length).toBe(HISTORY_DAYS)
  expect(Math.abs(h[h.length - 1].v - a.currentPrice)).toBeLessThan(0.01)
})

test('priceHistory es determinista', () => {
  expect(priceHistory('vwce')).toEqual(priceHistory('vwce'))
})

test('portfolioValueSeries último punto = Σ shares·currentPrice', () => {
  const s = portfolioValueSeries()
  const expected = assets.reduce((acc, a) => acc + a.shares * a.currentPrice, 0)
  expect(Math.abs(s[s.length - 1].v - expected)).toBeLessThan(1)
})

test('assetTransactions devuelve al menos una compra', () => {
  const txs = assetTransactions('vwce')
  expect(txs.some((t) => t.type === 'compra')).toBe(true)
})

test('assetTransactions incluye una compra para todo activo', () => {
  for (const a of assets) {
    expect(assetTransactions(a.id).some((t) => t.type === 'compra')).toBe(true)
  }
})

test('priceHistory de un id inexistente devuelve []', () => {
  expect(priceHistory('nonexistent')).toEqual([])
})
