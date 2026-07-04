/**
 * Selector segmentado genérico (rangos temporales del gráfico, u otras opciones
 * cortas). No conoce nada de "rangos" en concreto: recibe opciones y devuelve
 * la seleccionada, así vale para 1M/3M/6M/1A y para 1D/1S/1M/1A/MAX.
 */
interface RangeSelectorProps<T extends string> {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
}

export function RangeSelector<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = 'Rango',
}: RangeSelectorProps<T>) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="segmented__option"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
