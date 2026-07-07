import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Botón compartido para acciones puntuales (p. ej. CTA en la cabecera de una `Card`).
 *
 * @param children - Etiqueta del botón.
 * @param variant - Estilo visual: `primary` (acento verde, CTA principal) o `ghost`
 *   (transparente con borde, para acciones secundarias). Por defecto `primary`.
 * @param icon - Icono opcional mostrado antes del texto.
 * @param rest - Resto de props nativas de `<button>` (incluye `type`, que por defecto es `"button"`
 *   para no disparar envíos de formulario accidentales).
 */
export function Button({
  children,
  variant = 'primary',
  icon,
  type = 'button',
  className,
  ...rest
}: {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  icon?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variantClass = variant === 'ghost' ? 'btn-ghost' : 'btn-primary'
  return (
    <button
      type={type}
      className={className ? `btn ${variantClass} ${className}` : `btn ${variantClass}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
