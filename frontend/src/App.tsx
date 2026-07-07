import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import { Dashboard } from './dashboard/Dashboard'
import { Movimientos } from './movimientos/Movimientos'
import { Cartera } from './cartera/Cartera'
import { AssetDetail } from './cartera/AssetDetail'
import './app/app.css'

// Rutas de nivel superior anidadas bajo el app-shell (AppLayout: sidebar + topbar).
// Nueva pantalla de navegación → añadir aquí y en NAV_ITEMS de AppLayout.
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'movimientos', element: <Movimientos /> },
      { path: 'cartera', element: <Cartera /> },
      { path: 'cartera/:id', element: <AssetDetail /> },
    ],
  },
])

/** Raíz de la aplicación: monta el router de la SPA. */
export function App() {
  return <RouterProvider router={router} />
}
