import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  IconBell,
  IconBriefcase,
  IconExchange,
  IconGrid,
  IconSettings,
} from '../lib/icons'
import { NewMovementButton } from './NewMovementButton'
import { ThemeToggle } from './ThemeToggle'
import './app.css'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', Icon: IconGrid, end: true },
  { to: '/movimientos', label: 'Movimientos', Icon: IconExchange, end: false },
  { to: '/cartera', label: 'Cartera', Icon: IconBriefcase, end: false },
  { to: '/ajustes', label: 'Ajustes', Icon: IconSettings, end: false },
]

/** Título de la barra superior según la ruta activa. */
function titleForPath(pathname: string): string {
  if (pathname === '/') return 'Panel de Patrimonio'
  if (pathname.startsWith('/movimientos')) return 'Movimientos'
  if (pathname.startsWith('/cartera')) return 'Cartera de Inversión'
  if (pathname.startsWith('/ajustes')) return 'Ajustes'
  return 'Vesta Web'
}

/**
 * Plantilla de la aplicación: navegación lateral persistente + barra superior
 * con logo/título y acciones globales. Las pantallas se inyectan vía `<Outlet/>`.
 */
export function AppLayout() {
  const { pathname } = useLocation()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <nav className="sidebar__nav" aria-label="Navegación principal">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                'sidebar__link' + (isActive ? ' sidebar__link--active' : '')
              }
            >
              <Icon width={20} height={20} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <p className="sidebar__footer">Vesta Web · uso personal</p>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar__brand">
            <span className="topbar__logo" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="28" height="28">
                <rect width="32" height="32" rx="7" fill="var(--primary)" />
                <path
                  d="M9 9L16 23L23 9"
                  fill="none"
                  stroke="var(--primary-on)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="topbar__title">
              <span className="topbar__brand-name">Vesta Web</span>
              <h1>{titleForPath(pathname)}</h1>
            </div>
          </div>

          <div className="topbar__actions">
            <span className="topbar__currency" aria-hidden="true">
              EUR / USD
            </span>
            <ThemeToggle />
            <button type="button" className="icon-button" aria-label="Notificaciones">
              <IconBell width={18} height={18} />
            </button>
            <NewMovementButton />
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
