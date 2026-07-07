# Rediseño del frontend — 4 pantallas (Vesta Web)

- **Fecha:** 2026-07-05
- **Rama:** `feat/improveFront` (parte del scaffold vacío actual; NO se restaura `feat/initFront`)
- **Alcance:** solo frontend. Todos los datos son **mock** en esta fase (aún no se conecta la API de cotizaciones ni el backend real).
- **Fuente de verdad de diseño:** `DESIGN.md` + `PRODUCT.md`. Tokens semánticos, tema claro/oscuro, un único acento verde, rojo solo para pérdidas/gastos, `.num` en toda cifra.

## Decisiones tomadas

1. **Reconstruir desde cero** sobre el scaffold vacío de `feat/improveFront` (no se hace merge de `initFront`).
2. **Todo mock** — las 4 pantallas leen de un módulo de datos inventados determinista.
3. **Navegación:** 3 items laterales (Dashboard, Movimientos, Cartera). El detalle de activo es una ruta anidada en Cartera. El toggle de tema claro/oscuro vive en la **sidebar**.
4. **Charts con Recharts** (no SVG a mano). Wrappers finos tematizados con tokens.

## Arquitectura

Router (`react-router-dom`) con app-shell y `<Outlet/>`:

| Ruta           | Pantalla          | Nav                              |
| -------------- | ----------------- | -------------------------------- |
| `/`            | Dashboard         | sí                               |
| `/movimientos` | Movimientos       | sí                               |
| `/cartera`     | Cartera           | sí                               |
| `/cartera/:id` | Detalle de activo | no (se llega pulsando un activo) |

### App-shell — `src/app/AppLayout.tsx`

- **Sidebar** izquierda: logo "Vesta" + 3 items de nav con icono (iconos inline en `lib/icons.tsx`) + toggle de tema claro/oscuro (abajo del todo). Item activo resaltado con acento.
- **Topbar**: título de la pantalla actual (izquierda), icono perfil y ajustes (derecha). Estas dos últimas pantallas no serán implementadas por ahora.
- Contenido vía `<Outlet/>`.

### Tema — `src/lib/useTheme.ts` + `index.html`

- `data-theme` en `<html>`, persistido en `localStorage`, por defecto sigue al sistema.
- Snippet anti-FOUC inline en `index.html`.
- Fuentes **self-hosted** (Outfit + Plus Jakarta Sans): se copian los `.woff2` y el `@font-face` desde `feat/initFront` (`public/fonts/`) — son binarios/assets, no lógica.

### Tokens — `src/index.css`

- Tokens semánticos (`--bg`, `--surface`, `--elevated`, `--ink`, `--body`, `--muted`, `--border`, `--primary`, `--negative`, `--cat-1..6`) con valores canónicos de `DESIGN.md`, conmutando por `[data-theme]`.
- Clase `.num` (`font-variant-numeric: tabular-nums`) para toda cifra financiera.
- Escala tipográfica y de espaciado por variables. Sin `box-shadow` en reposo (Regla de lo Plano).

## Piezas reutilizables

### Charts — `src/charts/`

Wrappers finos sobre **Recharts**, tematizados con tokens (`stroke`/`fill` = `var(--…)`), sin gridlines pesadas, sin sombras, ejes atenuados, tooltip con tipografía tabular:

- **`AreaTrend.tsx`** — área + línea para series temporales (patrimonio, capital invertido, cotización). Prop: serie `{x, y}[]`, color de acento, formateador de eje/tooltip.
- **`Donut.tsx`** — `PieChart` con `innerRadius` para desgloses (gastos por categoría, distribución por clase de activo). Prop: segmentos `{label, value, color}[]`.
- **`RangeSelector.tsx`** — botones `1D · 1S · 1M · 3M · 6M · 1A · 3A · Todo` (nuestro, no es un chart). El rango seleccionado dirige **a la vez** la ventana del gráfico y la agregación de las stats. El mock genera puntos a resolución diaria para que `1D`/`1S` tengan datos que mostrar.

### Datos mock — `src/lib/mock.ts`

Determinista (semilla fija) para que las cifras sean estables entre recargas:

- `categories: {id, name, color}[]`
- `movements: {id, date, amount, categoryId, description}[]` — `amount` positivo = ingreso, negativo = gasto.
- `assets: {id, name, class, shares, avgCost, currentPrice}[]` — `class ∈ {ETF, Acciones, Oro, Cripto, …}`.
- `priceHistory(assetId): {x, y}[]` — cotización histórica del activo.
- `assetTransactions(assetId): {date, type: 'compra'|'venta', shares, price, fee}[]`.

### Agregación — `src/lib/aggregate.ts` (cliente)

- `filterByRange(movements, range)` → ventana temporal.
- `sumIngresos / sumGastos / balanceNeto` sobre un conjunto de movimientos.
- `patrimonioSeries(range)` → **liquidez acumulada (Σ ingresos − gastos) + valor de la cartera** a lo largo del tiempo.
- `gastosPorCategoria(movements)` → segmentos para el donut.
- `capitalInvertidoSeries(range)` → evolución del valor de la cartera.
- `distribucionPorClase(assets)` → segmentos por clase de activo.
- `assetMetrics(asset)` → `marketValue = shares·currentPrice`, `cost = shares·avgCost`, `pnl`, `pnl%`.

### Formato — `src/lib/format.ts`

Helpers es-ES: `fmtEuro`, `fmtPct`, `fmtDate`. Iconos inline en `src/lib/icons.tsx` (nav + flechas ▲▼ para signo).

## Pantallas

### 1 · Dashboard — `/`

- `RangeSelector` arriba.
- **Hero:** `AreaTrend` de la **evolución del patrimonio total** + número display grande = patrimonio actual.
- **Fila de stats** (reacciona al rango): **Capital invertido · Ingresos · Gastos · Balance neto**.
- **Inferior:** `Donut` de **gastos por categoría** + lista de **últimos movimientos** (importe, categoría, fecha, descripción).

### 2 · Movimientos — `/movimientos`

- **Navegador de mes** (‹ mes actual ›) — la pantalla es "movimientos mensuales".
- **Fila de stats del mes:** **Total ingresos · Total gastos · Balance neto**.
- **Lista de movimientos** del mes: importe (color según signo), categoría, fecha, descripción.

### 3 · Cartera — `/cartera`

- `RangeSelector` arriba.
- **Hero:** `AreaTrend` de la **evolución del capital invertido total** + número display = valor total de la cartera + rentabilidad total %.
- **`Donut`** de **distribución por clase de activo** (ETFs, Acciones, Oro…).
- **Lista de activos** (filas pulsables → `/cartera/:id`): nombre, clase, participaciones, cotización, valor de mercado, rentabilidad (€ y %).

### 4 · Detalle de activo — `/cartera/:id`

- Enlace de vuelta a Cartera. Cabecera: nombre + clase + `RangeSelector`.
- **Hero:** `AreaTrend` de la **cotización del activo** + precio actual + variación.
- **Fila de stats:** **Cotización · Valor de mercado · Posiciones (participaciones) · Rentabilidad aportada** (€/%).
- **Historial de transacciones** (lista): fecha, tipo (compra/venta), cantidad, precio, comisión, total.
- Si `:id` no existe en el mock → mensaje simple + enlace a Cartera.

## CSS

Una hoja por feature: `app/app.css`, `charts/charts.css`, `dashboard/dashboard.css`, `movimientos/movimientos.css`, `cartera/cartera.css` (el detalle de activo comparte `cartera.css`) + tokens globales en `index.css`. **Solo tokens semánticos**, nunca hex crudo. `.num` en toda cifra.

## Dependencias

- Añadir `recharts` (`bun add recharts` en `frontend/`).
- `react-router-dom` (ya previsto por el house style).
- Sin otras dependencias nuevas.

## Fuera de alcance (YAGNI por ahora)

- Backend real / API de cotizaciones (fase posterior).
- Alta/edición de movimientos y activos (formularios) — las pantallas son de lectura.
- Pantalla de Ajustes dedicada (el único ajuste, el tema, vive en la sidebar). Los iconos de perfil/ajustes de la topbar quedan como placeholders sin implementar.
- Objetivos (EP-W07), preferencias más allá del tema (EP-W05).

## Reglas de diseño no negociables (de DESIGN.md)

- Acento verde ≤10% de la pantalla; rojo solo junto a cifra negativa.
- Plano en reposo (sin `box-shadow` decorativa).
- `prefers-reduced-motion` respetado en transiciones.
- Contraste WCAG AA en ambos temas.
- Nada de azul marino+dorado, gradientes, glassmorphism, texto con gradiente, ni tablas sin jerarquía.
