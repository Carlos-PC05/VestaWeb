import { test, expect } from 'bun:test'
import { toCategory, toMovement, toAsset, toAssetTx } from './api'

// Filas tal y como las devuelve `pg`: snake_case y NUMERIC como string.

test('toCategory conserva id numérico y campos de presentación', () => {
  const c = toCategory({
    id: 3,
    name: 'Ocio',
    icon: 'film',
    color: '#A855F7',
    type: 'gasto',
    is_default: true,
    created_at: '2026-01-01T00:00:00.000Z',
  })
  expect(c).toEqual({ id: 3, name: 'Ocio', icon: 'film', color: '#A855F7', type: 'gasto' })
})

test('toMovement firma el importe según el tipo y normaliza campos', () => {
  const gasto = toMovement({
    id: 7,
    amount: '45.50',
    currency: 'EUR',
    type: 'gasto',
    description: 'Supermercado',
    occurred_at: '2026-07-01T10:00:00.000Z',
    category_id: 2,
  })
  expect(gasto.amount).toBe(-45.5)
  expect(gasto.categoryId).toBe(2)
  expect(gasto.date).toBe('2026-07-01T10:00:00.000Z')

  const ingreso = toMovement({
    id: 8,
    amount: '2400.00',
    currency: 'EUR',
    type: 'ingreso',
    description: null,
    occurred_at: '2026-07-01T10:00:00.000Z',
    category_id: null,
  })
  expect(ingreso.amount).toBe(2400)
  expect(ingreso.categoryId).toBeNull()
  expect(ingreso.description).toBe('')
})

test('toAsset convierte precios NUMERIC (string) a número y admite nulls', () => {
  const cotizado = toAsset({
    id: 1,
    naturaleza: 'cotizado',
    class: 'etf',
    name: 'Vanguard FTSE All-World',
    currency: 'EUR',
    ticker: 'VWCE',
    current_price: '112.35000000',
    manual_value: null,
    valued_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
  })
  expect(cotizado.currentPrice).toBe(112.35)
  expect(cotizado.manualValue).toBeNull()
  expect(cotizado.class).toBe('etf')

  const inmueble = toAsset({
    id: 2,
    naturaleza: 'no cotizado',
    class: 'inmueble',
    name: 'Piso',
    currency: 'EUR',
    ticker: null,
    current_price: null,
    manual_value: '180000.00',
    valued_at: '2026-06-01T00:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
  })
  expect(inmueble.currentPrice).toBeNull()
  expect(inmueble.manualValue).toBe(180000)
  expect(inmueble.valuedAt).toBe('2026-06-01T00:00:00.000Z')
})

test('toAssetTx convierte shares/precio/comisión a número', () => {
  const tx = toAssetTx({
    id: 5,
    asset_id: 1,
    type: 'compra',
    shares: '10.00000000',
    unit_price: '98.40000000',
    fee: '1.50',
    occurred_at: '2026-03-01T09:00:00.000Z',
    created_at: '2026-03-01T09:00:00.000Z',
  })
  expect(tx).toEqual({
    id: 5,
    assetId: 1,
    type: 'compra',
    shares: 10,
    unitPrice: 98.4,
    fee: 1.5,
    date: '2026-03-01T09:00:00.000Z',
  })
})

test('groupTxsByAsset agrupa por assetId', async () => {
  const { groupTxsByAsset } = await import('./api')
  const t = (id: number, assetId: number) => ({ id, assetId, type: 'compra' as const, shares: 1, unitPrice: 1, fee: 0, date: '2026-01-01T00:00:00Z' })
  const map = groupTxsByAsset([t(1, 1), t(2, 2), t(3, 1)])
  expect(map.get(1)?.length).toBe(2)
  expect(map.get(2)?.length).toBe(1)
})
