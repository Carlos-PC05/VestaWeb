/** Tarjeta de métrica: etiqueta, cifra grande (tabular) y subtexto opcional. */
export function StatCard({
  label,
  value,
  tone = 'neutral',
  sub,
}: {
  label: string
  value: string
  tone?: 'neutral' | 'positive' | 'negative'
  sub?: string
}) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value num tone-${tone}`}>{value}</span>
      {sub && <span className={`stat-sub num tone-${tone}`}>{sub}</span>}
    </div>
  )
}
