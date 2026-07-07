import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db'

/**
 * Router de operaciones de cartera (EP-W03, SRS §5.1 entidad
 * `asset_transactions`). Expone el CRUD que consume la SPA para registrar y
 * consultar compras/venta ligadas a un activo (HU-W03.03, HU-W03.04).
 */
export const assetTransactionsRouter = Router()

/** Esquema de una operación nueva. */
const createAssetTransactionSchema = z.object({
  assetId: z.number().int().positive(),
  type: z.enum(['compra', 'venta']),
  shares: z.number().positive('Las participaciones deben ser mayores que cero'),
  unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
  fee: z.number().nonnegative().default(0),
  occurredAt: z.iso.datetime({ offset: true }).optional(),
})

/** Esquema de edición: los mismos campos que la creación, todos opcionales. */
const updateAssetTransactionSchema = createAssetTransactionSchema.partial()

/** Mapea las claves en camelCase de la API a las columnas en snake_case de la tabla. */
const columnByField: Record<string, string> = {
  assetId: 'asset_id',
  type: 'type',
  shares: 'shares',
  unitPrice: 'unit_price',
  fee: 'fee',
  occurredAt: 'occurred_at',
}

/**
 * GET /api/asset-transactions
 * Lista operaciones, más recientes primero, con filtro opcional por
 * `assetId` para el historial de un activo (HU-W03.04).
 */
assetTransactionsRouter.get('/', async (req, res) => {
  const conditions: string[] = []
  const values: unknown[] = []

  if (typeof req.query.assetId === 'string') {
    values.push(Number(req.query.assetId))
    conditions.push(`asset_id = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(
    `SELECT * FROM asset_transactions ${whereClause} ORDER BY occurred_at DESC`,
    values,
  )
  res.json(rows)
})

/**
 * GET /api/asset-transactions/:id
 * Devuelve el detalle completo de una operación.
 */
assetTransactionsRouter.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM asset_transactions WHERE id = $1', [
    req.params.id,
  ])
  if (rows.length === 0) {
    res.status(404).json({ error: 'Operación no encontrada' })
    return
  }
  res.json(rows[0])
})

/**
 * POST /api/asset-transactions
 * Registra una nueva operación de compra/venta (HU-W03.03).
 */
assetTransactionsRouter.post('/', async (req, res) => {
  const parsed = createAssetTransactionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues })
    return
  }

  const { assetId, type, shares, unitPrice, fee, occurredAt } = parsed.data
  const { rows } = await pool.query(
    `INSERT INTO asset_transactions (asset_id, type, shares, unit_price, fee, occurred_at)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, now()))
     RETURNING *`,
    [assetId, type, shares, unitPrice, fee, occurredAt ?? null],
  )
  res.status(201).json(rows[0])
})

/**
 * PATCH /api/asset-transactions/:id
 * Corrige los campos indicados de una operación existente.
 */
assetTransactionsRouter.patch('/:id', async (req, res) => {
  const parsed = updateAssetTransactionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues })
    return
  }

  const fields = Object.entries(parsed.data)
  if (fields.length === 0) {
    res.status(400).json({ error: 'No hay campos que actualizar' })
    return
  }

  // Construye dinámicamente "columna = $n" solo para los campos recibidos,
  // traduciendo cada clave camelCase a su columna real en la tabla.
  const setClause = fields.map(([key], i) => `${columnByField[key]} = $${i + 1}`).join(', ')
  const values = fields.map(([, value]) => value)

  const { rows } = await pool.query(
    `UPDATE asset_transactions SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, req.params.id],
  )

  if (rows.length === 0) {
    res.status(404).json({ error: 'Operación no encontrada' })
    return
  }
  res.json(rows[0])
})

/**
 * DELETE /api/asset-transactions/:id
 * Elimina una operación.
 */
assetTransactionsRouter.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM asset_transactions WHERE id = $1', [
    req.params.id,
  ])
  if (rowCount === 0) {
    res.status(404).json({ error: 'Operación no encontrada' })
    return
  }
  res.status(204).send()
})
