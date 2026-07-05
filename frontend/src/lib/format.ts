const numberFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 4 })

/** Formatea una cantidad sin unidad (p. ej. participaciones), es-ES. */
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

export const formatCurrency = (amount: number): string => currencyFormatter.format(amount)
export const formatPercent = (fraction: number): string => percentFormatter.format(fraction)
export const formatMonthLabel = (date: Date): string => monthFormatter.format(date)
export const formatDayLabel = (date: Date): string => dayFormatter.format(date)

const timeFormatter = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })
const fullDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

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

export const formatFullDate = (input: string | Date): string =>
  fullDateFormatter.format(typeof input === 'string' ? new Date(input) : input)
