import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import { RouteError } from './app/RouteError'
import { Dashboard } from './dashboard/Dashboard'
import { Movimientos } from './movimientos/Movimientos'
import { Cartera } from './cartera/Cartera'
import { AssetDetail } from './cartera/AssetDetail'
import { assetDetailLoader, carteraLoader, dashboardLoader, movimientosLoader } from './app/loaders'
import './app/app.css'

/** Fallback del primer render mientras los loaders traen los datos iniciales. */
function BootFallback() {
  return (
    <div className="boot-fallback" aria-label="Cargando Vesta">
      <span className="brand-mark">V</span>
    </div>
  )
}

// Rutas de nivel superior anidadas bajo el app-shell (AppLayout: sidebar + topbar).
// Cada pantalla trae sus datos con un loader (definido junto a la pantalla);
// los errores de carga los captura la ruta sin path intermedia, para que el
// shell (sidebar/topbar) siga visible alrededor del error.
// Nueva pantalla de navegación → añadir aquí y en NAV_ITEMS de AppLayout.
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    hydrateFallbackElement: <BootFallback />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          { index: true, element: <Dashboard />, loader: dashboardLoader },
          { path: 'movimientos', element: <Movimientos />, loader: movimientosLoader },
          { path: 'cartera', element: <Cartera />, loader: carteraLoader },
          { path: 'cartera/:id', element: <AssetDetail />, loader: assetDetailLoader },
        ],
      },
    ],
  },
])

/** Raíz de la aplicación: monta el router de la SPA. */
export function App() {
  return <RouterProvider router={router} />
}
