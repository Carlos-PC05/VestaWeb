import { RANGES, type Range } from '../lib/range'
import './charts.css'

/** Selector de ventana temporal: controla gráfico y agregación a la vez. */
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
