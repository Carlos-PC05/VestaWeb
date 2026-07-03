import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { createTransaction, type Category, type MovementType } from '../lib/api'

interface QuickAddTransactionProps {
  categories: Category[]
  /** Arranca ya expandido: se usa en el estado vacío, donde es la única acción posible. */
  defaultOpen?: boolean
}

const todayInputValue = () => new Date().toISOString().slice(0, 10)

/**
 * Alta rápida de un movimiento (HU-W01.01) directamente desde el dashboard,
 * sin modal: un botón que revela un formulario inline progresivo, tal como
 * pide el registro "product" (`reference/product.md`, "Modal como primer
 * pensamiento" está prohibido). Es la única acción de escritura del panel;
 * el listado/calendario completo de movimientos es una pantalla aparte
 * (EP-W01) que todavía no existe.
 */
export function QuickAddTransaction({ categories, defaultOpen = false }: QuickAddTransactionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [type, setType] = useState<MovementType>('gasto')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [description, setDescription] = useState('')
  const [occurredAt, setOccurredAt] = useState(todayInputValue)
  const [validationError, setValidationError] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setAmount('')
      setDescription('')
      setValidationError(null)
      if (!defaultOpen) setOpen(false)
    },
  })

  const categoriesForType = categories.filter((c) => c.type === type)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsedAmount = Number(amount)
    // HU-W01.01: un importe vacío o a cero debe impedirse y avisar, no solo
    // dejar que falle la petición.
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

  if (!open) {
    return (
      <button type="button" className="btn-primary quick-add__trigger" onClick={() => setOpen(true)}>
        + Nuevo movimiento
      </button>
    )
  }

  return (
    <form className="quick-add" onSubmit={handleSubmit}>
      <div className="range-selector" role="group" aria-label="Tipo de movimiento">
        {(['gasto', 'ingreso'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className="range-selector__option"
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

      <div className="quick-add__fields">
        <label className="quick-add__field">
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

        <label className="quick-add__field">
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

        <label className="quick-add__field">
          <span>Fecha</span>
          <input
            type="date"
            value={occurredAt}
            max={todayInputValue()}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </label>

        <label className="quick-add__field quick-add__field--wide">
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
        <p className="quick-add__error">
          {validationError ?? 'No se ha podido guardar el movimiento. Inténtalo de nuevo.'}
        </p>
      )}

      <div className="quick-add__actions">
        {!defaultOpen && (
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando…' : 'Guardar movimiento'}
        </button>
      </div>
    </form>
  )
}
