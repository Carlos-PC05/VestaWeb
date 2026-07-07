const numberFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 4 })

/**
 * Formatea una cantidad sin unidad (p. ej. participaciones de un activo), en es-ES.
 *
 * @param n - Cantidad a formatear.
 * @returns Cadena formateada según la convención numérica española.
 */
export const formatNumber = (n: number): string => numberFormatter.format(n)

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('es-ES', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'short' })
const dayFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })

/**
 * Formatea un importe en euros según la convención española (símbolo, separadores).
 *
 * @param amount - Importe en euros.
 * @returns Cadena formateada como divisa (p. ej. "1.234,56 €").
 */
export const formatCurrency = (amount: number): string => currencyFormatter.format(amount)

/**
 * Formatea una fracción (0–1) como porcentaje es-ES, p. ej. para variaciones de P/L.
 *
 * @param fraction - Valor fraccional a expresar en porcentaje (0.05 → "5,0 %").
 * @returns Cadena formateada como porcentaje.
 */
export const formatPercent = (fraction: number): string => percentFormatter.format(fraction)

/**
 * Etiqueta abreviada del mes de una fecha, para ejes de gráficos temporales.
 *
 * @param date - Fecha a etiquetar.
 * @returns Nombre del mes abreviado (p. ej. "ene").
 */
export const formatMonthLabel = (date: Date): string => monthFormatter.format(date)

/**
 * Etiqueta abreviada "día mes" de una fecha, para ejes de gráficos temporales.
 *
 * @param date - Fecha a etiquetar.
 * @returns Cadena con día y mes abreviado (p. ej. "5 jul").
 */
export const formatDayLabel = (date: Date): string => dayFormatter.format(date)

const timeFormatter = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })
const fullDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/**
 * Formatea una fecha/hora de forma relativa al día actual ("Hoy, 14:32", "Ayer, 09:10"),
 * o con fecha abreviada si fue hace más de un día.
 *
 * @param input - Fecha (objeto `Date` o cadena ISO) a formatear.
 * @returns Cadena relativa lista para mostrar en la UI.
 */
export function formatRelativeDateTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  const time = timeFormatter.format(date)
  if (dayDiff === 0) return `Hoy, ${time}`
  if (dayDiff === 1) return `Ayer, ${time}`
  return `${dayFormatter.format(date)}, ${time}`
}

/**
 * Formatea una fecha completa con día, mes abreviado y año, es-ES.
 *
 * @param input - Fecha (objeto `Date` o cadena ISO) a formatear.
 * @returns Cadena con la fecha completa (p. ej. "5 jul 2026").
 */
export const formatFullDate = (input: string | Date): string =>
  fullDateFormatter.format(typeof input === 'string' ? new Date(input) : input)
