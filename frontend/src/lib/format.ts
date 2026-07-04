/**
 * Formateadores es-ES/EUR compartidos por el dashboard. La moneda principal
 * está fija a EUR por ahora: la preferencia de moneda (EP-W05) todavía no
 * existe como pantalla de configuración.
 */

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

/** Formatea un importe en euros, p. ej. -42.5 → "-42,50 €". */
export const formatCurrency = (amount: number): string => currencyFormatter.format(amount)

/** Formatea una fracción (0-1) como porcentaje, p. ej. 0.234 → "23,4 %". */
export const formatPercent = (fraction: number): string => percentFormatter.format(fraction)

/** Etiqueta corta de mes para el eje del gráfico, p. ej. "ene". */
export const formatMonthLabel = (date: Date): string => monthFormatter.format(date)

/** Etiqueta corta de día para el eje del gráfico, p. ej. "3 jul". */
export const formatDayLabel = (date: Date): string => dayFormatter.format(date)

const timeFormatter = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })
const fullDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/**
 * Fecha relativa con hora para listas de movimientos, p. ej. "Hoy, 14:32",
 * "Ayer, 18:15" o "28 mar, 09:00".
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

/** Fecha completa es-ES, p. ej. "15 jun 2026". */
export const formatFullDate = (input: string | Date): string =>
  fullDateFormatter.format(typeof input === 'string' ? new Date(input) : input)
