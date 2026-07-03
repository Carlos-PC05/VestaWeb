import { IconBriefcase } from '../lib/icons'

/**
 * Módulo de cartera de inversión. Deliberadamente un estado vacío honesto:
 * EP-W03 (activos, cotizaciones) no está construido todavía, así que no hay
 * ningún dato real que mostrar aquí. Nada de cifras inventadas.
 */
export function PortfolioPanel() {
  return (
    <div className="portfolio-panel">
      <IconBriefcase width={22} height={22} aria-hidden="true" />
      <h2>Cartera de inversión</h2>
      <p>
        Aún no hay activos registrados. Cuando el seguimiento de cartera esté
        disponible, verás aquí su valor de mercado y tu rentabilidad.
      </p>
    </div>
  )
}
