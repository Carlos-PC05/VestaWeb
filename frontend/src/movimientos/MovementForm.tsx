import { useState, type FormEvent } from 'react'
import { useRevalidator } from 'react-router-dom'
import { Modal } from '../app/Modal'
import { Button } from '../app/Button'
import { createMovement, type Category } from '../lib/api'

/** Fecha de hoy en formato `YYYY-MM-DD` para el valor inicial de `<input type="date">`. */
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Formulario modal de alta de movimiento (HU-W01.01): tipo, importe,
 * categoría (filtrada por tipo), descripción y fecha. Tras guardar,
 * revalida los loaders de la ruta para refrescar las listas y métricas.
 *
 * @param categories - Categorías disponibles; se filtran por el tipo elegido.
 * @param onClose - Cierra el modal (también tras un alta con éxito).
 */
export function MovementForm({
  categories,
  onClose,
}: {
  categories: Category[]
  onClose: () => void
}) {
  const revalidator = useRevalidator()
  const [type, setType] = useState<'gasto' | 'ingreso'>('gasto')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cats = categories.filter((c) => c.type === type)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const categoryId = fd.get('categoryId') as string
    setBusy(true)
    setError(null)
    try {
      await createMovement({
        type,
        amount: Number(fd.get('amount')),
        description: (fd.get('description') as string).trim() || undefined,
        // Mediodía local: la hora exacta no importa y así la fecha no baila
        // de día al convertir a UTC.
        occurredAt: new Date(`${fd.get('date')}T12:00:00`).toISOString(),
        categoryId: categoryId ? Number(categoryId) : null,
      })
      revalidator.revalidate()
      onClose()
    } catch {
      setError('No se pudo guardar el movimiento. Comprueba el backend e inténtalo de nuevo.')
      setBusy(false)
    }
  }

  return (
    <Modal title="Nuevo movimiento" onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="segmented" role="group" aria-label="Tipo de movimiento">
          <button
            type="button"
            className={type === 'gasto' ? 'is-active' : ''}
            onClick={() => setType('gasto')}
          >
            Gasto
          </button>
          <button
            type="button"
            className={type === 'ingreso' ? 'is-active' : ''}
            onClick={() => setType('ingreso')}
          >
            Ingreso
          </button>
        </div>

        <label className="field">
          <span>Importe (€)</span>
          <input name="amount" type="number" step="0.01" min="0.01" required autoFocus />
        </label>

        <label className="field">
          <span>Categoría</span>
          <select name="categoryId" defaultValue="">
            <option value="">Sin categoría</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Descripción</span>
          <input name="description" type="text" maxLength={200} placeholder="Supermercado, nómina…" />
        </label>

        <label className="field">
          <span>Fecha</span>
          <input name="date" type="date" defaultValue={today()} required />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar movimiento'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
