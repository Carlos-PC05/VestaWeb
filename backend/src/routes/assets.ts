import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db'

/**
 * Router de activos de cartera (EP-W03, SRS §5.1 entidad `assets`).
 * Expone el CRUD que consume la SPA para dar de alta, listar, filtrar,
 * consultar y editar activos cotizados (ETF, acciones, oro, cripto) y no
 * cotizados (inmuebles, vehículos, etc.) (HU-W03.01 a HU-W03.04).
 */
export const assetsRouter = Router()

/** Campos comunes a la creación y edición de un activo, antes de aplicar el refine de coherencia. */
const assetFieldsSchema = z.object({
  naturaleza: z.enum(['cotizado', 'no cotizado']),
  class: z.enum(['accion', 'etf', 'oro', 'cripto', 'inmueble', 'vehiculo', 'solar', 'otro']),
  name: z.string().trim().min(1),
  currency: z.string().trim().length(3).default('EUR'),
  ticker: z.string().trim().min(1).optional(),
  currentPrice: z.number().nonnegative().optional(),
  manualValue: z.number().nonnegative().optional(),
  valuedAt: z.iso.datetime({ offset: true }).optional(),
})

/**
 * Esquema de un activo nuevo. El `.refine` replica en el borde HTTP (con un
 * mensaje legible para la SPA) el CHECK `assets_naturaleza_fields` de la
 * tabla: los cotizados requieren `ticker`, los no cotizados requieren
 * `manualValue` y `valuedAt`.
 */
const createAssetSchema = assetFieldsSchema.refine(
  (data) =>
    data.naturaleza === 'cotizado'
      ? data.ticker !== undefined
      : data.manualValue !== undefined && data.valuedAt !== undefined,
  {
    message: 'Un activo cotizado requiere ticker; uno no cotizado requiere manualValue y valuedAt',
  },
)

/**
 * Esquema de edición: los mismos campos que la creación, todos opcionales.
 * No reaplica el `.refine` de coherencia (no tiene sentido sobre un objeto
 * parcial); el CHECK de la BD queda como última línea de defensa ante una
 * combinación inválida.
 */
const updateAssetSchema = assetFieldsSchema.partial()

/** Mapea las claves en camelCase de la API a las columnas en snake_case de la tabla. */
const columnByField: Record<string, string> = {
  naturaleza: 'naturaleza',
  class: 'class',
  name: 'name',
  currency: 'currency',
  ticker: 'ticker',
  currentPrice: 'current_price',
  manualValue: 'manual_value',
  valuedAt: 'valued_at',
}

/**
 * GET /api/assets
 * Lista activos, más recientes primero, con filtros opcionales por query
 * string: `naturaleza` (cotizado/no cotizado) y `class`.
 */
assetsRouter.get('/', async (req, res) => {
  const conditions: string[] = []
  const values: unknown[] = []

  if (req.query.naturaleza === 'cotizado' || req.query.naturaleza === 'no cotizado') {
    values.push(req.query.naturaleza)
    conditions.push(`naturaleza = $${values.length}`)
  }
  if (typeof req.query.class === 'string') {
    values.push(req.query.class)
    conditions.push(`class = $${values.length}`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(
    `SELECT * FROM assets ${whereClause} ORDER BY created_at DESC`,
    values,
  )
  res.json(rows)
})

/**
 * GET /api/assets/:id
 * Devuelve el detalle completo de un activo.
 */
assetsRouter.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM assets WHERE id = $1', [req.params.id])
  if (rows.length === 0) {
    res.status(404).json({ error: 'Activo no encontrado' })
    return
  }
  res.json(rows[0])
})

/**
 * POST /api/assets
 * Da de alta un nuevo activo (HU-W03.01, HU-W03.02).
 */
assetsRouter.post('/', async (req, res) => {
  const parsed = createAssetSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues })
    return
  }

  const { naturaleza, class: assetClass, name, currency, ticker, currentPrice, manualValue, valuedAt } =
    parsed.data
  const { rows } = await pool.query(
    `INSERT INTO assets (naturaleza, class, name, currency, ticker, current_price, manual_value, valued_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      naturaleza,
      assetClass,
      name,
      currency,
      ticker ?? null,
      currentPrice ?? null,
      manualValue ?? null,
      valuedAt ?? null,
    ],
  )
  res.status(201).json(rows[0])
})

/**
 * PATCH /api/assets/:id
 * Corrige los campos indicados de un activo existente.
 */
assetsRouter.patch('/:id', async (req, res) => {
  const parsed = updateAssetSchema.safeParse(req.body)
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
    `UPDATE assets SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, req.params.id],
  )

  if (rows.length === 0) {
    res.status(404).json({ error: 'Activo no encontrado' })
    return
  }
  res.json(rows[0])
})

/**
 * DELETE /api/assets/:id
 * Elimina un activo. Las operaciones asociadas se borran en cascada
 * (`asset_transactions.asset_id` es `ON DELETE CASCADE`).
 */
assetsRouter.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM assets WHERE id = $1', [req.params.id])
  if (rowCount === 0) {
    res.status(404).json({ error: 'Activo no encontrado' })
    return
  }
  res.status(204).send()
})
