# Vesta Web — Backend

API local + proxy de cotizaciones para Vesta Web. Express sobre Bun, sin paso de build (Bun ejecuta TypeScript directamente).

## Desarrollo

```
bun install
bun run dev
```

Requiere una instancia de PostgreSQL accesible vía `DATABASE_URL` (ver `.env.example` en la raíz del repo). Con Docker Compose no hace falta configurar nada a mano: `docker compose up` levanta `db`, `backend` y `frontend` juntos.

## Endpoints

- `GET /api/health` — verifica que el servicio y la conexión a Postgres están operativos.

## Estructura

- `src/index.ts` — servidor Express y rutas.
- `src/db.ts` — pool de conexión a Postgres (`pg`), configurado vía `DATABASE_URL`.
