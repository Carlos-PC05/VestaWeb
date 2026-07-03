import express from 'express'
import { pool } from './db'
import { categoriesRouter } from './routes/categories'
import { transactionsRouter } from './routes/transactions'

const app = express()
const port = Number(process.env.PORT ?? 3001)

// Parsea el body de las peticiones JSON entrantes (Express 5 no lo activa por defecto).
app.use(express.json())

/**
 * GET /api/health
 * Comprueba que el backend está arriba y que puede hablar con Postgres,
 * para que `docker compose up` sea fácil de verificar de un vistazo.
 */
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.status(503).json({ status: 'ok', db: 'unavailable' })
  }
})

app.use('/api/categories', categoriesRouter)
app.use('/api/transactions', transactionsRouter)

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
