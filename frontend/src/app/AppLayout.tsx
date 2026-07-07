import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import {
  IconClose,
  IconDashboard,
  IconMenu,
  IconMovements,
  IconMoon,
  IconSettings,
  IconSun,
  IconUser,
  IconWallet,
} from '../lib/icons'

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

/**
 * Lista de navegación principal (Dashboard/Movimientos/Cartera), compartida
 * entre la sidebar de escritorio y el drawer móvil para no duplicar JSX.
 *
 * @param onNavigate - Callback opcional invocado al pulsar un enlace; se usa
 *   en el drawer móvil para cerrarlo tras navegar (en la sidebar de
 *   escritorio se omite, ya que no hay nada que cerrar).
 */
function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="nav">
      {NAV.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'nav-item is-active' : 'nav-item')}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

/**
 * Botón de alternancia de tema claro/oscuro, compartido entre la sidebar de
 * escritorio y el drawer móvil. Lee y muta la preferencia de tema mediante
 * `useTheme` (basado en `useSyncExternalStore`), por lo que es seguro
 * montarlo simultáneamente en ambos lugares: ambas instancias se mantienen
 * sincronizadas sin props adicionales.
 */
function ThemeToggle() {
  const { resolved, setPreference } = useTheme()
  const isDark = resolved === 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setPreference(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      {isDark ? <IconSun /> : <IconMoon />}
      <span>{isDark ? 'Claro' : 'Oscuro'}</span>
    </button>
  )
}

/**
 * Botones de perfil y ajustes de la topbar, compartidos entre la topbar de
 * escritorio y el drawer móvil. Sin `onClick` todavía (pantallas pendientes).
 */
function ProfileSettingsButtons() {
  return (
    <>
      {/* TODO: perfil/ajustes */}
      <button type="button" className="topbar-btn" aria-label="Perfil">
        <IconUser />
      </button>
      <button type="button" className="topbar-btn" aria-label="Ajustes">
        <IconSettings />
      </button>
    </>
  )
}

/**
 * App-shell de la SPA: sidebar de navegación + toggle de tema, topbar con
 * título derivado de la ruta activa, y el `<Outlet />` donde se renderiza
 * la pantalla correspondiente. Se monta una sola vez como layout raíz.
 *
 * En viewports móviles (`≤720px`, ver `app.css`) la sidebar se oculta y se
 * sustituye por una top bar compacta con hamburguesa (`.mobile-topbar`) que
 * abre un drawer deslizante (`.drawer`) con el mismo contenido de la
 * sidebar (nav, tema, perfil/ajustes), reutilizando los fragmentos
 * `NavList`/`ThemeToggle`/`ProfileSettingsButtons` para no duplicar UI.
 * El estado `menuOpen` controla la apertura del drawer; se cierra al pulsar
 * el backdrop, el botón de cierre, un enlace de navegación, o la tecla Escape.
 * Mientras está abierto se bloquea el scroll del body, el drawer queda
 * marcado como `inert`/`aria-hidden` cuando está cerrado (para que sus
 * elementos no sean focables ni anunciados fuera de pantalla), y el foco se
 * mueve al botón de cierre al abrir y de vuelta a la hamburguesa al cerrar.
 */
export function AppLayout() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Cierra el drawer con la tecla Escape mientras está abierto.
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  // Bloquea el scroll del body mientras el drawer está abierto, para que el
  // fondo no se desplace por detrás del overlay.
  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  // Gestión de foco del diálogo: al abrir, el foco pasa al botón de cierre
  // dentro del drawer; al cerrar, vuelve a la hamburguesa que lo abrió. Se
  // omite en el montaje inicial (menuOpen empieza en `false`) para no robar
  // el foco de la página al cargarla.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (menuOpen) {
      closeButtonRef.current?.focus()
    } else {
      burgerRef.current?.focus()
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">V</span>
          <span className="brand-name">Vesta</span>
        </div>
        <NavList />
        <ThemeToggle />
      </aside>

      <div className="main">
        <header className="mobile-topbar">
          <div className="brand">
            <span className="brand-mark">V</span>
            <span className="brand-name">Vesta</span>
          </div>
          <button
            type="button"
            ref={burgerRef}
            className="burger"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls="mobile-drawer"
            onClick={() => setMenuOpen(true)}
          >
            <IconMenu />
          </button>
        </header>

        <div
          className={menuOpen ? 'drawer-backdrop is-open' : 'drawer-backdrop'}
          onClick={closeMenu}
          aria-hidden="true"
        />
        <aside
          id="mobile-drawer"
          className={menuOpen ? 'drawer is-open' : 'drawer'}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
        >
          <div className="drawer-head">
            <div className="brand">
              <span className="brand-mark">V</span>
              <span className="brand-name">Vesta</span>
            </div>
            <button
              type="button"
              ref={closeButtonRef}
              className="burger"
              aria-label="Cerrar menú"
              onClick={closeMenu}
            >
              <IconClose />
            </button>
          </div>
          <NavList onNavigate={closeMenu} />
          <ThemeToggle />
          <div className="topbar-actions">
            <ProfileSettingsButtons />
          </div>
        </aside>

        <header className="topbar">
          <h1 className="topbar-title">{titleFor(pathname)}</h1>
          <div className="topbar-actions">
            <ProfileSettingsButtons />
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
