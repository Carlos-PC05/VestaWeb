import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Point } from '../lib/mock'
import { formatCurrency, formatDayLabel } from '../lib/format'

type Props = {
  data: Point[]
  color?: string
  height?: number
  valueFmt?: (n: number) => string
}

/**
 * Gráfico de área/línea para series temporales (patrimonio, capital
 * invertido, cotización), tematizado con tokens de color CSS.
 *
 * @param data - Puntos `{ t, v }` a representar, ordenados por tiempo.
 * @param color - Token de color CSS para trazo y relleno. Por defecto `var(--primary)`.
 * @param height - Alto en px del contenedor responsive. Por defecto 300.
 * @param valueFmt - Formateador del eje Y y del tooltip. Por defecto `formatCurrency`.
 */
export function AreaTrend({ data, color = 'var(--primary)', height = 300, valueFmt = formatCurrency }: Props) {
  // Id único por instancia: varios AreaTrend en la misma pantalla no deben
  // compartir el mismo <linearGradient id>, o Recharts pintaría con el ajeno.
  const gradientId = 'areaFill-' + useId().replace(/:/g, '')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="t"
          type="number"
          domain={['dataMin', 'dataMax']}
          scale="time"
          tickFormatter={(t) => formatDayLabel(new Date(t))}
          tick={{ fill: 'var(--muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={48}
        />
        <YAxis
          dataKey="v"
          domain={['auto', 'auto']}
          tick={{ fill: 'var(--muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={54}
          tickFormatter={(v) => valueFmt(v)}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
          labelFormatter={(t) => formatDayLabel(new Date(Number(t)))}
          formatter={(v) => [valueFmt(Number(v)), '']}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: color }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
