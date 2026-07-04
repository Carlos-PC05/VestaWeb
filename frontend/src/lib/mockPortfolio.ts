/**
 * DATOS MOCK de cartera de inversión (EP-W03).
 *
 * TEMPORAL: el backend de activos/cotizaciones no existe todavía. Estos datos
 * imitan la forma de las entidades del SRS §5.1 (`assets`, `asset_transactions`,
 * `quotes`) para que, cuando se conecte la API de cotizaciones, el cambio sea
 * sustituir este módulo por llamadas reales sin tocar los componentes.
 */

export type AssetClass = 'etf' | 'accion' | 'cripto' | 'oro' | 'inmueble'

export interface Asset {
  id: string
  name: string
  ticker: string
  class: AssetClass
  shares: number
  avgPrice: number
  marketPrice: number
}

export interface AssetTransaction {
  id: string
  assetId: string
  type: 'compra' | 'venta'
  shares: number
  price: number
  fee: number
  date: string
}

export interface Quote {
  date: string
  price: number
}

export const ASSET_CLASS_LABEL: Record<AssetClass, string> = {
  etf: 'ETFs',
  accion: 'Acciones',
  cripto: 'Cripto',
  oro: 'Oro',
  inmueble: 'Inmuebles',
}

/** Color de cada clase de activo (usa la ramp de categorías de los tokens). */
export const ASSET_CLASS_COLOR: Record<AssetClass, string> = {
  etf: 'var(--cat-1)',
  accion: 'var(--cat-2)',
  cripto: 'var(--cat-3)',
  oro: 'var(--cat-6)',
  inmueble: 'var(--cat-4)',
}

export const MOCK_ASSETS: Asset[] = [
  { id: 'voo', name: 'Vanguard S&P 500', ticker: 'VOO', class: 'etf', shares: 42, avgPrice: 380.5, marketPrice: 410.25 },
  { id: 'aapl', name: 'Apple Inc.', ticker: 'AAPL', class: 'accion', shares: 60, avgPrice: 145.2, marketPrice: 175.5 },
  { id: 'btc', name: 'Bitcoin', ticker: 'BTC', class: 'cripto', shares: 0.35, avgPrice: 45000, marketPrice: 41200 },
  { id: 'gold', name: 'Oro físico', ticker: 'XAU', class: 'oro', shares: 30, avgPrice: 58, marketPrice: 71 },
]

/** Valor de mercado de un activo (participaciones × precio actual). */
export const marketValue = (a: Asset): number => a.shares * a.marketPrice

/** Coste medio invertido en un activo (participaciones × precio medio). */
export const costBasis = (a: Asset): number => a.shares * a.avgPrice

/** Plusvalía/minusvalía latente de un activo (valor de mercado − coste). */
export const unrealizedPnl = (a: Asset): number => marketValue(a) - costBasis(a)

/** Capital invertido total: suma del valor de mercado de todos los activos. */
export const investedCapital = (assets: Asset[] = MOCK_ASSETS): number =>
  assets.reduce((sum, a) => sum + marketValue(a), 0)

/** P/L total latente de la cartera. */
export const totalPnl = (assets: Asset[] = MOCK_ASSETS): number =>
  assets.reduce((sum, a) => sum + unrealizedPnl(a), 0)

/** Distribución del valor de mercado por clase de activo, mayor primero. */
export function allocationByClass(assets: Asset[] = MOCK_ASSETS) {
  const byClass = new Map<AssetClass, number>()
  for (const a of assets) {
    byClass.set(a.class, (byClass.get(a.class) ?? 0) + marketValue(a))
  }
  return [...byClass.entries()]
    .map(([cls, value]) => ({ cls, value, color: ASSET_CLASS_COLOR[cls], label: ASSET_CLASS_LABEL[cls] }))
    .sort((a, b) => b.value - a.value)
}
