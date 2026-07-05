import { RANGES, type Range } from '../lib/range'
import './charts.css'

/**
 * Selector de ventana temporal (1D/1S/1M/…): controla a la vez qué tramo
 * de la serie se dibuja en el gráfico y qué movimientos entran en la
 * agregación del periodo. Estado controlado: la pantalla padre guarda el `Range`.
 *
 * @param value - Rango actualmente seleccionado.
 * @param onChange - Callback al elegir un rango distinto.
 */
export function RangeSelector({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="range-selector" role="tablist" aria-label="Rango temporal">
      {RANGES.map((r) => (
        <button
          type="button"
          key={r}
          role="tab"
          aria-selected={r === value}
          className={r === value ? 'range-btn is-active' : 'range-btn'}
          onClick={() => onChange(r)}
        >
          {r}
        </button>
      ))}
    </div>
  )
}
