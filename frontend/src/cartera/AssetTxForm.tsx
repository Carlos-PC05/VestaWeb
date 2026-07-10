import { useState, type FormEvent } from 'react'
import { useRevalidator } from 'react-router-dom'
import { Modal } from '../app/Modal'
import { Button } from '../app/Button'
import { createAssetTx } from '../lib/api'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Formulario modal de alta de operación de un activo (HU-W03.03): compra o
 * venta con participaciones, precio unitario, comisión y fecha.
 *
 * @param assetId - Activo al que pertenece la operación.
 * @param onClose - Cierra el modal (también tras un alta con éxito).
 */
export function AssetTxForm({ assetId, onClose }: { assetId: number; onClose: () => void }) {
  const revalidator = useRevalidator()
  const [type, setType] = useState<'compra' | 'venta'>('compra')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await createAssetTx({
        assetId,
        type,
        shares: Number(fd.get('shares')),
        unitPrice: Number(fd.get('unitPrice')),
        fee: Number(fd.get('fee') || 0),
        occurredAt: new Date(`${fd.get('date')}T12:00:00`).toISOString(),
      })
      revalidator.revalidate()
      onClose()
    } catch {
      setError('No se pudo guardar la operación. Comprueba el backend e inténtalo de nuevo.')
      setBusy(false)
    }
  }

  return (
    <Modal title="Nueva operación" onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="segmented" role="group" aria-label="Tipo de operación">
          <button
            type="button"
            className={type === 'compra' ? 'is-active' : ''}
            onClick={() => setType('compra')}
          >
            Compra
          </button>
          <button
            type="button"
            className={type === 'venta' ? 'is-active' : ''}
            onClick={() => setType('venta')}
          >
            Venta
          </button>
        </div>

        <label className="field">
          <span>Participaciones</span>
          <input name="shares" type="number" step="any" min="0.00000001" required autoFocus />
        </label>

        <label className="field">
          <span>Precio unitario (€)</span>
          <input name="unitPrice" type="number" step="any" min="0" required />
        </label>

        <label className="field">
          <span>Comisión (€)</span>
          <input name="fee" type="number" step="0.01" min="0" defaultValue="0" />
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
            {busy ? 'Guardando…' : 'Guardar operación'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
