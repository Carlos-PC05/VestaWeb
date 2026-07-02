import express from 'express'
import { pool } from './db'

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.status(503).json({ status: 'ok', db: 'unavailable' })
  }
})

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
