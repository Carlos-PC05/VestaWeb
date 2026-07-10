/**
 * Capa de acceso al API REST del backend (`/api/*`, proxied por Vite).
 * Aquí viven los tipos de dominio del frontend y los adaptadores que
 * convierten las filas crudas de Postgres (snake_case, NUMERIC como string)
 * a objetos camelCase con números reales. Ninguna pantalla habla con
 * `fetch` directamente: todo pasa por estas funciones.
 */

// --- Tipos de dominio ---

export type Category = {
  id: number
  name: string
  icon: string
  color: string
  type: 'ingreso' | 'gasto'
}

/** Movimiento con importe firmado: positivo = ingreso, negativo = gasto. */
export type Movement = {
  id: number
  date: string
  amount: number
  categoryId: number | null
  description: string
}

export type AssetClass =
  | 'accion'
  | 'etf'
  | 'oro'
  | 'cripto'
  | 'inmueble'
  | 'vehiculo'
  | 'solar'
  | 'otro'

export type Asset = {
  id: number
  naturaleza: 'cotizado' | 'no cotizado'
  class: AssetClass
  name: string
  currency: string
  ticker: string | null
  currentPrice: number | null
  manualValue: number | null
  valuedAt: string | null
}

export type AssetTx = {
  id: number
  assetId: number
  type: 'compra' | 'venta'
  shares: number
  unitPrice: number
  fee: number
  date: string
}

/** Punto de una serie temporal: epoch ms + valor. */
export type Point = { t: number; v: number }

/** Etiquetas de presentación de las clases de activo. */
export const CLASS_LABEL: Record<AssetClass, string> = {
  accion: 'Acciones',
  etf: 'ETF',
  oro: 'Oro',
  cripto: 'Cripto',
  inmueble: 'Inmueble',
  vehiculo: 'Vehículo',
  solar: 'Solar',
  otro: 'Otro',
}

// --- Adaptadores fila → dominio ---

/** `pg` serializa NUMERIC como string para no perder precisión; aquí basta el double de JS. */
const num = (value: string | number | null): number | null =>
  value === null ? null : Number(value)

/* eslint-disable @typescript-eslint/no-explicit-any -- las filas llegan sin tipar del JSON */

export function toCategory(row: any): Category {
  return { id: row.id, name: row.name, icon: row.icon, color: row.color, type: row.type }
}

export function toMovement(row: any): Movement {
  const amount = Number(row.amount)
  return {
    id: row.id,
    date: row.occurred_at,
    amount: row.type === 'gasto' ? -amount : amount,
    categoryId: row.category_id,
    description: row.description ?? '',
  }
}

export function toAsset(row: any): Asset {
  return {
    id: row.id,
    naturaleza: row.naturaleza,
    class: row.class,
    name: row.name,
    currency: row.currency,
    ticker: row.ticker,
    currentPrice: num(row.current_price),
    manualValue: num(row.manual_value),
    valuedAt: row.valued_at,
  }
}

export function toAssetTx(row: any): AssetTx {
  return {
    id: row.id,
    assetId: row.asset_id,
    type: row.type,
    shares: Number(row.shares),
    unitPrice: Number(row.unit_price),
    fee: Number(row.fee),
    date: row.occurred_at,
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** Agrupa las operaciones por activo, para pasarlas a las funciones de `aggregate`. */
export function groupTxsByAsset(txs: AssetTx[]): Map<number, AssetTx[]> {
  const map = new Map<number, AssetTx[]>()
  for (const tx of txs) {
    const list = map.get(tx.assetId)
    if (list) list.push(tx)
    else map.set(tx.assetId, [tx])
  }
  return map
}

// --- Cliente HTTP ---

/** Error de API con el estado HTTP y el cuerpo devuelto por el backend. */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ApiError(res.status, body || `Error ${res.status}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

// --- Lecturas ---

export const fetchCategories = async (): Promise<Category[]> =>
  (await request<unknown[]>('/categories')).map(toCategory)

export const fetchMovements = async (): Promise<Movement[]> =>
  (await request<unknown[]>('/transactions')).map(toMovement)

export const fetchAssets = async (): Promise<Asset[]> =>
  (await request<unknown[]>('/assets')).map(toAsset)

export const fetchAssetTxs = async (assetId?: number): Promise<AssetTx[]> =>
  (
    await request<unknown[]>(
      assetId === undefined ? '/asset-transactions' : `/asset-transactions?assetId=${assetId}`,
    )
  ).map(toAssetTx)

export const fetchAsset = async (id: number): Promise<Asset> =>
  toAsset(await request<unknown>(`/assets/${id}`))

// --- Escrituras (payloads con la forma que valida el backend con Zod) ---

export type NewMovement = {
  amount: number
  type: 'ingreso' | 'gasto'
  description?: string
  occurredAt?: string
  categoryId?: number | null
}

export const createMovement = async (input: NewMovement): Promise<Movement> =>
  toMovement(await request<unknown>('/transactions', { method: 'POST', body: JSON.stringify(input) }))

export const deleteMovement = (id: number): Promise<void> =>
  request<void>(`/transactions/${id}`, { method: 'DELETE' })

export type NewAsset = {
  naturaleza: 'cotizado' | 'no cotizado'
  class: AssetClass
  name: string
  ticker?: string
  currentPrice?: number
  manualValue?: number
  valuedAt?: string
}

export const createAsset = async (input: NewAsset): Promise<Asset> =>
  toAsset(await request<unknown>('/assets', { method: 'POST', body: JSON.stringify(input) }))

export const deleteAsset = (id: number): Promise<void> =>
  request<void>(`/assets/${id}`, { method: 'DELETE' })

export type NewAssetTx = {
  assetId: number
  type: 'compra' | 'venta'
  shares: number
  unitPrice: number
  fee?: number
  occurredAt?: string
}

export const createAssetTx = async (input: NewAssetTx): Promise<AssetTx> =>
  toAssetTx(
    await request<unknown>('/asset-transactions', { method: 'POST', body: JSON.stringify(input) }),
  )

export const deleteAssetTx = (id: number): Promise<void> =>
  request<void>(`/asset-transactions/${id}`, { method: 'DELETE' })
