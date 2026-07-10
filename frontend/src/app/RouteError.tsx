import { Link, useRouteError, useRevalidator } from 'react-router-dom'
import { ApiError } from '../lib/api'
import { Button } from './Button'

/**
 * Pantalla de error de ruta: la muestra el router cuando un loader falla
 * (backend caído, recurso inexistente...). Distingue el 404 de un recurso
 * concreto del resto de fallos, y ofrece reintentar sin recargar la página.
 */
export function RouteError() {
  const error = useRouteError()
  const revalidator = useRevalidator()
  const notFound = error instanceof ApiError && error.status === 404

  return (
    <div className="route-error">
      <h2>{notFound ? 'No encontrado' : 'No se pudieron cargar los datos'}</h2>
      <p>
        {notFound
          ? 'El recurso que buscas no existe o fue eliminado.'
          : 'Comprueba que el backend está arrancado (docker compose up) y vuelve a intentarlo.'}
      </p>
      <div className="route-error-actions">
        {notFound ? (
          <Link to="/" className="btn btn-primary">
            Volver al dashboard
          </Link>
        ) : (
          <Button onClick={() => revalidator.revalidate()}>Reintentar</Button>
        )}
      </div>
    </div>
  )
}
