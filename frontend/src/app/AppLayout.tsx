import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import { IconDashboard, IconMovements, IconMoon, IconSun, IconWallet } from '../lib/icons'

const NAV = [
  { to: '/', label: 'Dashboard', Icon: IconDashboard, end: true },
  { to: '/movimientos', label: 'Movimientos', Icon: IconMovements, end: false },
  { to: '/cartera', label: 'Cartera', Icon: IconWallet, end: false },
]

/** Deriva el título de la topbar a partir de la ruta activa. */
function titleFor(pathname: string): string {
  if (pathname.startsWith('/movimientos')) return 'Movimientos'
  if (pathname.startsWith('/cartera')) return 'Cartera'
  return 'Dashboard'
}

export function AppLayout() {
  const { resolved, setPreference } = useTheme()
  const { pathname } = useLocation()
  const isDark = resolved === 'dark'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">V</span>
          <span className="brand-name">Vesta</span>
        </div>
        <nav className="nav">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'nav-item is-active' : 'nav-item')}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setPreference(isDark ? 'light' : 'dark')}
          aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {isDark ? <IconSun /> : <IconMoon />}
          <span>{isDark ? 'Claro' : 'Oscuro'}</span>
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1 className="topbar-title">{titleFor(pathname)}</h1>
          <div className="topbar-actions" aria-hidden="true">
            {/* Perfil y ajustes: placeholders sin implementar por ahora. */}
            <span className="topbar-chip" />
            <span className="topbar-chip" />
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
