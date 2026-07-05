import type { ReactNode } from 'react'

/**
 * Panel de sección: cabecera opcional (título + acción) y contenido.
 *
 * @param title - Título de la cabecera; si se omite y no hay `action`, no se renderiza cabecera.
 * @param action - Elemento opcional a mostrar en la cabecera (p. ej. un selector de rango).
 * @param children - Contenido del panel.
 * @param className - Clases CSS adicionales a añadir a la clase base `card`.
 */
export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className ? `card ${className}` : 'card'}>
      {(title || action) && (
        <header className="card-head">
          {title && <h3 className="card-title">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
