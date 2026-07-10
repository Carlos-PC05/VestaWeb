/**
 * Iconos SVG propios (sin librería externa) usados en nav, topbar y toggles.
 * Todos comparten trazo y viewBox vía `base()`; el nombre de cada icono ya
 * describe su uso, así que no se documentan uno a uno.
 */
type IconProps = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const IconDashboard = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
)

export const IconMovements = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 7h13l-3-3M20 17H7l3 3" />
  </svg>
)

export const IconWallet = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18M16 14h2" />
  </svg>
)

export const IconSun = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const IconMoon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
)

export const IconArrow = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 5v14M6 11l6-6 6 6" />
  </svg>
)

/** Chevron con `dir` para invertir su orientación (volteo horizontal por CSS). */
export const IconChevron = ({ dir = 'right', size = 18 }: IconProps & { dir?: 'left' | 'right' }) => (
  <svg {...base(size)} style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const IconUser = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
)

export const IconSettings = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
)

export const IconPlus = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconMenu = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

export const IconTrash = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
  </svg>
)

export const IconClose = ({ size = 22 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
