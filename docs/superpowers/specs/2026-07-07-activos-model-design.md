# Plan: Modelo de Activos y sus Operaciones (cartera)

## Contexto

La cartera de inversión (EP-W03 del SRS) no tiene modelo de datos todavía: no existe migración SQL ni router de backend para activos. El frontend solo trabaja con datos falsos deterministas en `frontend/src/lib/mock.ts` (tipos `Asset` y `AssetTx`), y esos mocks solo cubren activos **cotizados** (ETF/Acciones/Oro/Cripto).

Esta tarea crea la capa de persistencia y API para:

1. **Activos** (`assets`) — cotizados **y** no cotizados, fiel al SRS §5.1.
2. **Operaciones de activo** (`asset_transactions`) — compra/venta ligadas a un activo (lo que el usuario llamó "Movimientos" de la cartera).

Los movimientos de ingreso/gasto (`transactions`) **ya están implementados** y quedan fuera de alcance. Esta tarea es **solo BD + backend** (migración SQL + router Express con Zod); el frontend sigue leyendo de `lib/mock.ts` hasta un cableado posterior. El precio actual de los cotizados se guarda como columna `current_price` en el propio activo (sin tabla `quotes` ni API de mercado por ahora).

Decisiones confirmadas con el usuario:
- Alcance: cotizados + no cotizados (SRS completo).
- Capa: BD + backend (Zod + router), sin tocar frontend.
- Cotizaciones: columna `current_price` en `assets` (sin caché `quotes`).

## Fuentes / patrones a replicar

- Esquema y convenciones SQL: `postgresdb/002_transactions.sql` (SERIAL PK, `NUMERIC(14,2)`, enums vía `TEXT ... CHECK (col IN (...))` con literales en español minúscula, `TIMESTAMPTZ DEFAULT now()`, `occurred_at` vs `created_at`, índices `idx_<tabla>_<col>`).
- Patrón de router: `backend/src/routes/transactions.ts` (Zod `createXSchema` + `.partial()`, `columnByField` camelCase→snake_case, GET lista con filtros, GET/:id 404, POST 201, PATCH con SET dinámico, DELETE 204).
- Montaje: `backend/src/index.ts` (`app.use('/api/...', router)`).
- Referencia de campos SRS: §5.1 líneas 388-389 (`assets`, `asset_transactions`).

## Cambios

### 1. `postgresdb/003_assets.sql` (nuevo)

Tabla `assets` con soporte para naturaleza cotizado/no cotizado:

```sql
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    naturaleza TEXT NOT NULL CHECK (naturaleza IN ('cotizado', 'no cotizado')),
    class TEXT NOT NULL CHECK (class IN
        ('accion', 'etf', 'oro', 'cripto', 'inmueble', 'vehiculo', 'solar', 'otro')),
    name TEXT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    -- Solo cotizados: ticker y último precio conocido (SRS §5.1).
    ticker TEXT,
    current_price NUMERIC(18, 8),
    -- Solo no cotizados: valoración manual y su fecha (HU-W03.02).
    manual_value NUMERIC(14, 2),
    valued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Coherencia entre naturaleza y campos condicionales.
    CONSTRAINT assets_naturaleza_fields CHECK (
        (naturaleza = 'cotizado'     AND ticker IS NOT NULL) OR
        (naturaleza = 'no cotizado'  AND manual_value IS NOT NULL AND valued_at IS NOT NULL)
    )
);
```

Notas de diseño:
- `class` usa literales SRS en minúscula/sin acento, alineados a la convención `'ingreso'/'gasto'`. (Mismatch conocido con el mock, que usa `'ETF'|'Acciones'|'Oro'|'Cripto'`; se reconciliará al cablear el frontend, fuera de alcance.)
- Métricas derivadas (precio medio, participaciones totales, valor de mercado, plusvalía latente, comisiones acumuladas) **no se almacenan**: se calculan desde `asset_transactions` (SRS §5.1 línea 389).

### 2. `postgresdb/004_asset_transactions.sql` (nuevo)

```sql
CREATE TABLE asset_transactions (
    id SERIAL PRIMARY KEY,
    -- Una operación sin activo no tiene sentido: CASCADE (a diferencia de
    -- transactions.category_id, donde el huérfano "sin categoría" sí es útil).
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('compra', 'venta')),
    shares NUMERIC(28, 8) NOT NULL CHECK (shares > 0),
    unit_price NUMERIC(18, 8) NOT NULL CHECK (unit_price >= 0),
    fee NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_transactions_asset_id ON asset_transactions (asset_id);
CREATE INDEX idx_asset_transactions_occurred_at ON asset_transactions (occurred_at);
```

- `shares` con 8 decimales para permitir fracciones (cripto).
- `fee` por defecto 0 (SRS lo lista, pero puede ser sin comisión).

### 3. `backend/src/routes/assets.ts` (nuevo)

Router CRUD calcado de `transactions.ts`:
- `createAssetSchema` (Zod): `naturaleza` (`z.enum`), `class` (`z.enum` con las 8 clases), `name`, `currency` (`.length(3).default('EUR')`), `ticker` opcional, `currentPrice` opcional, `manualValue` opcional, `valuedAt` (`z.iso.datetime`) opcional. Añadir `.refine(...)` que replique el CHECK de coherencia (cotizado⇒ticker; no cotizado⇒manualValue+valuedAt) con mensaje legible.
- `updateAssetSchema = createAssetSchema.partial()` (ojo: el `.refine` va sobre el objeto base; para PATCH parcial basta con dejar que el CHECK de la BD sea la última defensa).
- `columnByField`: `currentPrice→current_price`, `manualValue→manual_value`, `valuedAt→valued_at`, resto identidad.
- Handlers: GET `/` (filtro opcional por `naturaleza` y `class` vía query, `ORDER BY created_at DESC`), GET `/:id` (404 "Activo no encontrado"), POST (201), PATCH (SET dinámico), DELETE (204). Mensajes de error en español.

### 4. `backend/src/routes/assetTransactions.ts` (nuevo)

Router calcado de `transactions.ts`:
- `createAssetTransactionSchema`: `assetId` (`z.number().int().positive()`), `type` (`z.enum(['compra','venta'])`), `shares` (`.positive()`), `unitPrice` (`.nonnegative()`), `fee` (`.nonnegative().default(0)`), `occurredAt` opcional.
- `columnByField`: `assetId→asset_id`, `unitPrice→unit_price`, `occurredAt→occurred_at`, resto identidad.
- GET `/` con filtro por `assetId` (query) para el historial de un activo (HU-W03.04), `ORDER BY occurred_at DESC`. GET `/:id`, POST, PATCH, DELETE como el resto.

### 5. `backend/src/index.ts` (editar)

Importar y montar los dos routers junto a los existentes:
```ts
app.use('/api/assets', assetsRouter)
app.use('/api/asset-transactions', assetTransactionsRouter)
```

## Verificación

Como no hay tests de backend ni cableado de frontend, se verifica end-to-end con la API real:

1. Levantar el stack: `docker compose up` (recrea el volumen de Postgres si es necesario para que corran las nuevas migraciones `003`/`004`; las migraciones solo se ejecutan con el volumen vacío).
2. Comprobar salud: `GET http://localhost:3001/api/health` → `{ status: 'ok', db: 'connected' }`.
3. Crear activo cotizado:
   `POST /api/assets` con `{ "naturaleza":"cotizado","class":"etf","name":"Vanguard FTSE All-World","ticker":"VWCE","currentPrice":112.35 }` → 201.
4. Crear activo no cotizado:
   `POST /api/assets` con `{ "naturaleza":"no cotizado","class":"inmueble","name":"Piso","manualValue":180000,"valuedAt":"2026-07-07T00:00:00Z" }` → 201.
5. Validar el CHECK de coherencia: `POST` cotizado **sin** ticker → 400 con mensaje del `.refine`.
6. Crear operación: `POST /api/asset-transactions` con `{ "assetId":1,"type":"compra","shares":10,"unitPrice":98.4,"fee":1.5 }` → 201.
7. Listar historial: `GET /api/asset-transactions?assetId=1` → array con la operación.
8. Borrado en cascada: `DELETE /api/assets/1` → 204; luego `GET /api/asset-transactions?assetId=1` → array vacío (verifica `ON DELETE CASCADE`).
9. `bun run dev` en `backend/` para confirmar que TypeScript/arranque no rompen.
