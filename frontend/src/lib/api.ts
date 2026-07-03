/**
 * Cliente HTTP mínimo hacia el backend local (mismo origen vía proxy de Vite
 * en desarrollo, o el propio backend en producción). Sin capas de más:
 * un `fetch` con manejo de error, nada de un cliente HTTP genérico.
 */

export type MovementType = 'ingreso' | 'gasto'

export interface Category {
  id: number
  name: string
  icon: string
  color: string
  type: MovementType
  is_default: boolean
}

export interface Transaction {
  id: number
  amount: string
  currency: string
  type: MovementType
  description: string | null
  occurred_at: string
  category_id: number | null
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

/**
 * Ejecuta una petición GET contra la API y decodifica la respuesta JSON.
 * Centraliza el manejo de errores HTTP para que las queries no lo repitan.
 *
 * @param path - Ruta relativa a `API_BASE` (p. ej. "/transactions").
 * @returns El cuerpo de la respuesta ya parseado.
 */
async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar ${path}`)
  }
  return response.json() as Promise<T>
}

/**
 * Ejecuta una petición POST con cuerpo JSON y decodifica la respuesta.
 *
 * @param path - Ruta relativa a `API_BASE` (p. ej. "/transactions").
 * @param body - Cuerpo a serializar como JSON.
 * @returns El recurso creado, tal como lo devuelve la API.
 */
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Error ${response.status} al crear el recurso en ${path}`)
  }
  return response.json() as Promise<T>
}

export const fetchCategories = () => apiGet<Category[]>('/categories')
export const fetchTransactions = () => apiGet<Transaction[]>('/transactions')

export interface NewTransactionInput {
  amount: number
  type: MovementType
  categoryId: number | null
  description?: string
  occurredAt: string
}

export const createTransaction = (input: NewTransactionInput) =>
  apiPost<Transaction>('/transactions', input)
