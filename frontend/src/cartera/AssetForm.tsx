import { useState, type FormEvent } from 'react'
import { useRevalidator } from 'react-router-dom'
import { Modal } from '../app/Modal'
import { Button } from '../app/Button'
import { CLASS_LABEL, createAsset, type AssetClass } from '../lib/api'

/** Clases de activo que aplican a cada naturaleza (coherentes con el CHECK de la tabla). */
const CLASSES: Record<'cotizado' | 'no cotizado', AssetClass[]> = {
  cotizado: ['etf', 'accion', 'oro', 'cripto', 'otro'],
  'no cotizado': ['inmueble', 'vehiculo', 'solar', 'otro'],
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Formulario modal de alta de activo (HU-W03.01, HU-W03.02). Los campos
 * cambian con la naturaleza: cotizado pide ticker (y opcionalmente su
 * cotización actual), no cotizado pide valoración manual y su fecha.
 *
 * @param onClose - Cierra el modal (también tras un alta con éxito).
 */
export function AssetForm({ onClose }: { onClose: () => void }) {
  const revalidator = useRevalidator()
  const [naturaleza, setNaturaleza] = useState<'cotizado' | 'no cotizado'>('cotizado')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      const currentPrice = fd.get('currentPrice') as string
      await createAsset({
        naturaleza,
        class: fd.get('class') as AssetClass,
        name: (fd.get('name') as string).trim(),
        ...(naturaleza === 'cotizado'
          ? {
              ticker: (fd.get('ticker') as string).trim().toUpperCase(),
              currentPrice: currentPrice ? Number(currentPrice) : undefined,
            }
          : {
              manualValue: Number(fd.get('manualValue')),
              valuedAt: new Date(`${fd.get('valuedAt')}T12:00:00`).toISOString(),
            }),
      })
      revalidator.revalidate()
      onClose()
    } catch {
      setError('No se pudo guardar el activo. Comprueba el backend e inténtalo de nuevo.')
      setBusy(false)
    }
  }

  return (
    <Modal title="Nuevo activo" onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="segmented" role="group" aria-label="Naturaleza del activo">
          <button
            type="button"
            className={naturaleza === 'cotizado' ? 'is-active' : ''}
            onClick={() => setNaturaleza('cotizado')}
          >
            Cotizado
          </button>
          <button
            type="button"
            className={naturaleza === 'no cotizado' ? 'is-active' : ''}
            onClick={() => setNaturaleza('no cotizado')}
          >
            No cotizado
          </button>
        </div>

        <label className="field">
          <span>Nombre</span>
          <input
            name="name"
            type="text"
            required
            maxLength={120}
            autoFocus
            placeholder={naturaleza === 'cotizado' ? 'Vanguard FTSE All-World' : 'Piso en la playa'}
          />
        </label>

        <label className="field">
          <span>Clase</span>
          <select name="class" key={naturaleza} defaultValue={CLASSES[naturaleza][0]}>
            {CLASSES[naturaleza].map((c) => (
              <option key={c} value={c}>
                {CLASS_LABEL[c]}
              </option>
            ))}
          </select>
        </label>

        {naturaleza === 'cotizado' ? (
          <>
            <label className="field">
              <span>Ticker</span>
              <input name="ticker" type="text" required maxLength={12} placeholder="VWCE" />
            </label>
            <label className="field">
              <span>Cotización actual (€) — opcional</span>
              <input name="currentPrice" type="number" step="any" min="0" />
            </label>
          </>
        ) : (
          <>
            <label className="field">
              <span>Valoración (€)</span>
              <input name="manualValue" type="number" step="0.01" min="0" required />
            </label>
            <label className="field">
              <span>Fecha de valoración</span>
              <input name="valuedAt" type="date" defaultValue={today()} required />
            </label>
          </>
        )}

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
            {busy ? 'Guardando…' : 'Guardar activo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
