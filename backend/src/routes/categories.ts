import { Router } from 'express'
import { z } from 'zod'
import { pool } from '../db'

/**
 * Router de categorías (EP-W02, SRS §5.1 entidad `categories`).
 * Expone el CRUD que consume la SPA para listar, crear, editar y borrar
 * categorías de movimientos (HU-W02.01, HU-W02.02).
 */
export const categoriesRouter = Router()

/** Esquema de una categoría nueva: nombre, icono, color y tipo son obligatorios. */
const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  icon: z.string().trim().min(1, 'El icono es obligatorio'),
  color: z.string().trim().min(1, 'El color es obligatorio'),
  type: z.enum(['ingreso', 'gasto']),
})

/** Esquema de edición: los mismos campos que la creación, todos opcionales. */
const updateCategorySchema = createCategorySchema.partial()

/**
 * GET /api/categories
 * Devuelve todas las categorías, con las predefinidas primero y luego
 * las del usuario ordenadas alfabéticamente.
 */
categoriesRouter.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM categories ORDER BY is_default DESC, name ASC',
  )
  res.json(rows)
})

/**
 * POST /api/categories
 * Crea una categoría personalizada (HU-W02.02). Las categorías creadas por
 * el usuario nunca son `is_default`, ese indicador solo lo tienen las
 * sembradas por el esquema inicial.
 */
categoriesRouter.post('/', async (req, res) => {
  const parsed = createCategorySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues })
    return
  }

  const { name, icon, color, type } = parsed.data
  const { rows } = await pool.query(
    `INSERT INTO categories (name, icon, color, type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, icon, color, type],
  )
  res.status(201).json(rows[0])
})

/**
 * PATCH /api/categories/:id
 * Actualiza los campos indicados de una categoría existente.
 */
categoriesRouter.patch('/:id', async (req, res) => {
  const parsed = updateCategorySchema.safeParse(req.body)
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
  // para no pisar con NULL los campos que el usuario no quiso cambiar.
  const setClause = fields.map(([key], i) => `${key} = $${i + 1}`).join(', ')
  const values = fields.map(([, value]) => value)

  const { rows } = await pool.query(
    `UPDATE categories SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, req.params.id],
  )

  if (rows.length === 0) {
    res.status(404).json({ error: 'Categoría no encontrada' })
    return
  }
  res.json(rows[0])
})

/**
 * DELETE /api/categories/:id
 * Elimina una categoría. Los movimientos asociados no se borran: la
 * restricción `ON DELETE SET NULL` de `transactions.category_id` los deja
 * como "sin categoría" (REQ-DAT-W03).
 */
categoriesRouter.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [
    req.params.id,
  ])
  if (rowCount === 0) {
    res.status(404).json({ error: 'Categoría no encontrada' })
    return
  }
  res.status(204).send()
})
