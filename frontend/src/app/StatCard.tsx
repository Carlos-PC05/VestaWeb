/**
 * Tarjeta de métrica: etiqueta, cifra grande (tabular) y subtexto opcional.
 *
 * @param label - Etiqueta descriptiva de la métrica.
 * @param value - Valor a destacar, ya formateado (usa la clase `.num`).
 * @param tone - Color semántico del valor: neutro, positivo o negativo. Por defecto `'neutral'`.
 * @param sub - Texto secundario opcional (p. ej. variación en el periodo).
 */
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
