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
