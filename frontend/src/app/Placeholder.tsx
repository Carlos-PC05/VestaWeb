import type { ReactNode } from 'react'

/**
 * Página placeholder para rutas cuya pantalla real llega en una fase posterior
 * (Cartera → Fase 2, Movimientos → Fase 3). Mantiene la navegación completa sin
 * fingir datos ni funcionalidad.
 */
export function Placeholder({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card state-block">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  )
}
