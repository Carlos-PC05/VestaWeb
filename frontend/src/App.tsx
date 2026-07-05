import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import { Dashboard } from './dashboard/Dashboard'
import { Movimientos } from './movimientos/Movimientos'
import { Cartera } from './cartera/Cartera'
import { AssetDetail } from './cartera/AssetDetail'
import './app/app.css'

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

export function App() {
  return <RouterProvider router={router} />
}
