import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createTransaction, fetchCategories, type MovementType } from '../lib/api'
import { IconPlus } from '../lib/icons'

const todayInputValue = () => new Date().toISOString().slice(0, 10)

interface NewMovementButtonProps {
  /** Variante visual del disparador: botón sólido (topbar) o enlace de texto. */
  variant?: 'primary' | 'ghost'
  label?: string
}

/**
 * Alta de un movimiento (HU-W01.01) mediante un `<dialog>` nativo — evita los
 * problemas de recorte por stacking-context de un popover absoluto y da
 * cierre con Escape y foco atrapado gratis. Reutilizable desde la barra
 * superior y desde el estado vacío del dashboard.
 */
export function NewMovementButton({ variant = 'primary', label = 'Nuevo movimiento' }: NewMovementButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })

  const [type, setType] = useState<MovementType>('gasto')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [occurredAt, setOccurredAt] = useState(todayInputValue)
  const [validationError, setValidationError] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      resetForm()
      dialogRef.current?.close()
    },
  })

  function resetForm() {
    setAmount('')
    setDescription('')
    setCategoryId('')
    setType('gasto')
    setOccurredAt(todayInputValue())
    setValidationError(null)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsedAmount = Number(amount)
    // HU-W01.01: importe vacío o ≤ 0 se impide y se avisa.
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('El importe debe ser mayor que cero.')
      return
    }
    setValidationError(null)
    mutation.mutate({
      amount: parsedAmount,
      type,
      categoryId: categoryId === '' ? null : Number(categoryId),
      description: description.trim() || undefined,
      occurredAt: new Date(`${occurredAt}T12:00:00`).toISOString(),
    })
  }

  // Cierra al hacer clic en el backdrop (fuera del panel).
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close()
    }
    dialog.addEventListener('click', onClick)
    return () => dialog.removeEventListener('click', onClick)
  }, [])

  const categoriesForType = (categoriesQuery.data ?? []).filter((c) => c.type === type)

  return (
    <>
      <button
        type="button"
        className={variant === 'primary' ? 'btn-primary' : 'btn-ghost'}
        onClick={() => dialogRef.current?.showModal()}
      >
        <IconPlus width={16} height={16} aria-hidden="true" />
        {label}
      </button>

      <dialog ref={dialogRef} className="movement-dialog" aria-label="Nuevo movimiento">
        <form className="movement-form" onSubmit={handleSubmit}>
          <h2>Nuevo movimiento</h2>

          <div className="segmented" role="group" aria-label="Tipo de movimiento">
            {(['gasto', 'ingreso'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className="segmented__option"
                aria-pressed={option === type}
                onClick={() => {
                  setType(option)
                  setCategoryId('')
                }}
              >
                {option === 'gasto' ? 'Gasto' : 'Ingreso'}
              </button>
            ))}
          </div>

          <div className="movement-form__fields">
            <label className="field">
              <span>Importe</span>
              <input
                className="num"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </label>

            <label className="field">
              <span>Categoría</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Sin categoría</option>
                {categoriesForType.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Fecha</span>
              <input
                type="date"
                value={occurredAt}
                max={todayInputValue()}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </label>

            <label className="field field--wide">
              <span>Descripción (opcional)</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="p. ej. Supermercado"
              />
            </label>
          </div>

          {(validationError || mutation.isError) && (
            <p className="movement-form__error">
              {validationError ?? 'No se ha podido guardar el movimiento. Inténtalo de nuevo.'}
            </p>
          )}

          <div className="movement-form__actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => dialogRef.current?.close()}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Guardar movimiento'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
