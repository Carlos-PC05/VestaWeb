import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import { Placeholder } from './app/Placeholder'
import { Dashboard } from './dashboard/Dashboard'
import { Settings } from './settings/Settings'

/**
 * Rutas de la aplicación bajo la plantilla `AppLayout`. Cartera y Movimientos
 * son placeholders en esta iteración (Fases 2 y 3 del remodelado).
 */
function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route
          path="movimientos"
          element={
            <Placeholder title="Movimientos">
              La lista mensual de movimientos y el calendario llegan en la siguiente iteración.
            </Placeholder>
          }
        />
        <Route
          path="cartera"
          element={
            <Placeholder title="Cartera de Inversión">
              El seguimiento de la cartera (distribución y activos) llega en la siguiente iteración.
            </Placeholder>
          }
        />
        <Route path="ajustes" element={<Settings />} />
        <Route
          path="*"
          element={<Placeholder title="Página no encontrada">Esta ruta no existe.</Placeholder>}
        />
      </Route>
    </Routes>
  )
}

export default App
