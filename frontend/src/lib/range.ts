/** Ventanas temporales del selector de rango; controlan gráfico y agregación. */
export type Range = '1D' | '1S' | '1M' | '3M' | '6M' | '1A' | '3A' | 'Todo'

export const RANGES: Range[] = ['1D', '1S', '1M', '3M', '6M', '1A', '3A', 'Todo']

export const RANGE_DAYS: Record<Range, number> = {
  '1D': 1,
  '1S': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1A': 365,
  '3A': 1095,
  Todo: Infinity,
}

const DAY = 86_400_000

/**
 * Epoch ms del inicio de la ventana del rango, contando hacia atrás desde `now`.
 *
 * @param range - Rango temporal seleccionado.
 * @param now - Instante de referencia (parametrizable para tests); por defecto, ahora.
 * @returns Epoch ms de inicio; `-Infinity` para `'Todo'` (sin recorte).
 */
export function rangeStart(range: Range, now: Date = new Date()): number {
  const days = RANGE_DAYS[range]
  return days === Infinity ? -Infinity : now.getTime() - days * DAY
}
