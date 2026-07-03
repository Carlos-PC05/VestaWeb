import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db'

/**
 * Router de movimientos (EP-W01, SRS §5.1 entidad `transactions`).
 * Expone el CRUD que consume la SPA para registrar, listar, filtrar,
 * consultar y editar ingresos/gastos (HU-W01.01 a HU-W01.05).
 */
export const transactionsRouter = Router()

/**
 * Esquema de un movimiento nuevo. El importe se valida en el borde HTTP
 * (mensaje de error legible para la SPA) aunque la tabla ya lo protege con
 * un CHECK (amount > 0) como última línea de defensa.
 */
const createTransactionSchema = z.object({
  amount: z.number().positive('El importe debe ser mayor que cero'),
  currency: z.string().trim().length(3).default('EUR'),
  type: z.enum(['ingreso', 'gasto']),
  description: z.string().trim().optional(),
  occurredAt: z.iso.datetime({ offset: true }).optional(),
  categoryId: z.number().int().positive().nullable().optional(),
})

/** Esquema de edición: los mismos campos que la creación, todos opcionales. */
const updateTransactionSchema = createTransactionSchema.partial()

/** Mapea las claves en camelCase de la API a las columnas en snake_case de la tabla. */
const columnByField: Record<string, string> = {
  amount: 'amount',
  currency: 'currency',
  type: 'type',
  description: 'description',
  occurredAt: 'occurred_at',
  categoryId: 'category_id',
}

/**
 * GET /api/transactions
 * Lista movimientos, más recientes primero, con filtros opcionales por
 * query string (HU-W01.03): `type` (ingreso/gasto) y `categoryId`.
 */
transactionsRouter.get('/', async (req, res) => {
  const conditions: string[] = []
  const values: unknown[] = []

  if (req.query.type === 'ingreso' || req.query.type === 'gasto') {
    values.push(req.query.type)
    conditions.push(`type = $${values.length}`)
  }
  if (typeof req.query.categoryId === 'string') {
    values.push(Number(req.query.categoryId))
    conditions.push(`category_id = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(
    `SELECT * FROM transactions ${whereClause} ORDER BY occurred_at DESC`,
    values,
  )
  res.json(rows)
})

/**
 * GET /api/transactions/:id
 * Devuelve el detalle completo de un movimiento (HU-W01.05).
 */
transactionsRouter.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM transactions WHERE id = $1', [
    req.params.id,
  ])
  if (rows.length === 0) {
    res.status(404).json({ error: 'Movimiento no encontrado' })
    return
  }
  res.json(rows[0])
})

/**
 * POST /api/transactions
 * Registra un nuevo movimiento (HU-W01.01).
 */
transactionsRouter.post('/', async (req, res) => {
  const parsed = createTransactionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues })
    return
  }

  const { amount, currency, type, description, occurredAt, categoryId } = parsed.data
  const { rows } = await pool.query(
    `INSERT INTO transactions (amount, currency, type, description, occurred_at, category_id)
     VALUES ($1, $2, $3, $4, COALESCE($5, now()), $6)
     RETURNING *`,
    [amount, currency, type, description ?? null, occurredAt ?? null, categoryId ?? null],
  )
  res.status(201).json(rows[0])
})

/**
 * PATCH /api/transactions/:id
 * Corrige los campos indicados de un movimiento existente (HU-W01.02).
 */
transactionsRouter.patch('/:id', async (req, res) => {
  const parsed = updateTransactionSchema.safeParse(req.body)
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
  const setClause = fields
    .map(([key], i) => `${columnByField[key]} = $${i + 1}`)
    .join(', ')
  const values = fields.map(([, value]) => value)

  const { rows } = await pool.query(
    `UPDATE transactions SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, req.params.id],
  )

  if (rows.length === 0) {
    res.status(404).json({ error: 'Movimiento no encontrado' })
    return
  }
  res.json(rows[0])
})

/**
 * DELETE /api/transactions/:id
 * Elimina un movimiento (HU-W01.02).
 */
transactionsRouter.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM transactions WHERE id = $1', [
    req.params.id,
  ])
  if (rowCount === 0) {
    res.status(404).json({ error: 'Movimiento no encontrado' })
    return
  }
  res.status(204).send()
})
