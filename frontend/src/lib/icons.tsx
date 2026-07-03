import type { ReactElement, SVGProps } from 'react'

/**
 * Set de iconos propio, trazo minimalista (24×24, stroke 1.75, currentColor).
 * Nada de una librería de iconos nueva para una docena de glifos: encaja con
 * NFR-W16 ("vanilla") y evita un paquete completo por unos pocos SVG.
 */
const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconWallet(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconTrendUp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 16 10 10 14 14 20 7" />
      <path d="M14 7h6v6" />
    </svg>
  )
}

export function IconTrendDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8 10 14 14 10 20 17" />
      <path d="M14 17h6v-6" />
    </svg>
  )
}

export function IconUtensils(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3v7a2 2 0 0 0 4 0V3" />
      <path d="M9 10v11" />
      <path d="M17 3c-1.5 1.5-2 3-2 5s.5 2.5 2 3v10" />
    </svg>
  )
}

export function IconHome(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  )
}

export function IconFilm(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M3 15h18M8 4v16M16 4v16" />
    </svg>
  )
}

export function IconCar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 16V12l2.5-5h11L20 12v4" />
      <path d="M4 16h16" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  )
}

export function IconHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20 4.5 12.7a4.6 4.6 0 0 1 0-6.6 4.7 4.7 0 0 1 6.6 0L12 7l.9-.9a4.7 4.7 0 0 1 6.6 0 4.6 4.6 0 0 1 0 6.6z" />
    </svg>
  )
}

export function IconBook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </svg>
  )
}

export function IconDots(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconBriefcase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
      <path d="M3 12h18" />
    </svg>
  )
}

export function IconInbox(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h4l1.5 3h5L16 12h4" />
      <path d="M4 12 6 5h12l2 7v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    </svg>
  )
}

/** Icono de categoría por slug (los sembrados en `postgresdb/001_categories.sql`). */
const CATEGORY_ICONS: Record<string, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  utensils: IconUtensils,
  home: IconHome,
  film: IconFilm,
  car: IconCar,
  heart: IconHeart,
  book: IconBook,
  ellipsis: IconDots,
  wallet: IconWallet,
}

/** Devuelve el icono de una categoría, o un fallback si el slug no está mapeado. */
export function CategoryIcon({
  icon,
  ...props
}: { icon: string } & SVGProps<SVGSVGElement>) {
  const Icon = CATEGORY_ICONS[icon] ?? IconDots
  return <Icon {...props} />
}
