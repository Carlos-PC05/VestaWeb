import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Segment } from '../lib/aggregate'
import { formatCurrency } from '../lib/format'

type Props = { data: Segment[]; valueFmt?: (n: number) => string }

/** Donut de desglose (gastos por categoría, distribución por clase). */
export function Donut({ data, valueFmt = formatCurrency }: Props) {
  const total = data.reduce((acc, s) => acc + s.value, 0)
  return (
    <div className="donut">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={64}
            outerRadius={92}
            paddingAngle={2}
            stroke="var(--surface)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((s) => (
              <Cell key={s.label} fill={s.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
            formatter={(v, name) => [valueFmt(Number(v)), String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="donut-legend">
        {data.map((s) => (
          <li key={s.label}>
            <span className="donut-dot" style={{ background: s.color }} />
            <span className="donut-label">{s.label}</span>
            <span className="donut-val num">{valueFmt(s.value)}</span>
            <span className="donut-pct num">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
