import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import { Dashboard } from './dashboard/Dashboard'
import { Movimientos } from './movimientos/Movimientos'
import { Cartera } from './cartera/Cartera'
import './app/app.css'

const Placeholder = ({ name }: { name: string }) => <div className="card">{name} — en construcción</div>

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'movimientos', element: <Movimientos /> },
      { path: 'cartera', element: <Cartera /> },
      { path: 'cartera/:id', element: <Placeholder name="Detalle" /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
