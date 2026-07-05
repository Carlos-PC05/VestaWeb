# Rediseño del frontend — 4 pantallas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir el frontend de Vesta Web en `feat/improveFront` como una SPA de 4 pantallas (Dashboard, Movimientos, Cartera, Detalle de activo) sobre datos mock, siguiendo el design system.

**Architecture:** App-shell con sidebar (3 items + toggle de tema) y topbar, router de `react-router-dom`. Datos inventados deterministas en `lib/mock.ts`; agregación cliente en `lib/aggregate.ts`; gráficos con wrappers finos sobre **Recharts** tematizados con tokens CSS. Cada pantalla es de solo lectura.

**Tech Stack:** Vite + React 19 + TypeScript, `react-router-dom`, `recharts`, CSS plano con tokens semánticos, `bun` (runtime + `bun test` para lógica pura).

## Global Constraints

- **Solo tokens semánticos** en CSS (`--bg`, `--surface`, `--ink`, `--primary`, `--negative`, `--cat-1..6`…). Nunca hex crudo en componentes/hojas de feature.
- **`.num`** en toda cifra financiera (importes, %, precios).
- Acento verde (`--primary`) ≤10% de pantalla; rojo (`--negative`) solo junto a cifra negativa.
- Plano en reposo: sin `box-shadow` decorativa; sombra solo en hover/foco/flotantes.
- Copy de UI en **español (España)**. Moneda EUR, formato es-ES.
- Sin dependencias nuevas salvo `recharts` y `react-router-dom`.
- Fuentes self-hosted (Outfit + Plus Jakarta Sans); sin Google Fonts en runtime.
- Tests de lógica pura con `bun test` (integrado, sin runner nuevo). UI se verifica con `bun run build` + `bun run lint` + revisión visual en `bun run dev`.
- Tema por defecto sigue al sistema; preferencia en `localStorage` clave `vesta-theme`.

## File Structure

```
frontend/
  index.html                      # anti-FOUC inline (Task 1)
  package.json                    # + recharts, react-router-dom (Task 1)
  public/fonts/outfit.woff2       # copiado de initFront (Task 1)
  public/fonts/plus-jakarta-sans.woff2
  public/favicon.svg
  src/
    main.tsx                      # monta <App/> (Task 1)
    App.tsx                       # router (Task 6)
    index.css                     # tokens + reset (Task 1)
    lib/
      useTheme.ts                 # hook de tema (Task 1)
      format.ts                   # formateadores es-ES (Task 2)
      range.ts                    # Range + rangeStart (Task 2)
      mock.ts                     # datos inventados deterministas (Task 3)
      aggregate.ts                # agregación cliente (Task 4)
      icons.tsx                   # iconos inline (Task 5)
      mock.test.ts                # (Task 3)
      aggregate.test.ts           # (Task 4)
      range.test.ts               # (Task 2)
    app/
      AppLayout.tsx               # sidebar + topbar + <Outlet/> (Task 6)
      StatCard.tsx                # tarjeta de métrica reutilizable (Task 6)
      Card.tsx                    # panel de sección reutilizable (Task 6)
      app.css                     # (Task 6)
    charts/
      RangeSelector.tsx           # botones de rango (Task 5)
      AreaTrend.tsx               # área/línea temporal (Task 5)
      Donut.tsx                   # donut de desglose (Task 5)
      charts.css                  # (Task 5)
    dashboard/
      Dashboard.tsx               # (Task 7)
      dashboard.css               # (Task 7)
    movimientos/
      Movimientos.tsx             # (Task 8)
      movimientos.css             # (Task 8)
    cartera/
      Cartera.tsx                 # lista + charts (Task 9)
      AssetDetail.tsx             # detalle (Task 10)
      cartera.css                 # (Task 9, compartida por AssetDetail)
```

---

## Task 1: Scaffold — deps, fuentes, tokens, tema

**Files:**
- Modify: `frontend/package.json` (añadir deps)
- Create: `frontend/public/fonts/outfit.woff2`, `frontend/public/fonts/plus-jakarta-sans.woff2`, `frontend/public/favicon.svg` (copiados de `feat/initFront`)
- Create/overwrite: `frontend/index.html`, `frontend/src/index.css`, `frontend/src/main.tsx`, `frontend/src/lib/useTheme.ts`
- Delete: `frontend/src/App.css`, `frontend/src/assets/*` (scaffold Vite sobrante)

**Interfaces:**
- Produces: `useTheme()` → `{ preference, resolved, setPreference }`; tokens CSS globales; app arranca con tema aplicado.

- [ ] **Step 1: Instalar dependencias**

Run:
```bash
cd frontend && bun add recharts react-router-dom
```
Expected: `package.json` lista `recharts` y `react-router-dom` en `dependencies`.

- [ ] **Step 2: Copiar assets de fuentes/favicon desde initFront**

Run (desde la raíz del repo):
```bash
git show feat/initFront:frontend/public/fonts/outfit.woff2 > frontend/public/fonts/outfit.woff2
git show feat/initFront:frontend/public/fonts/plus-jakarta-sans.woff2 > frontend/public/fonts/plus-jakarta-sans.woff2
git show feat/initFront:frontend/public/favicon.svg > frontend/public/favicon.svg
```
Expected: los tres archivos existen y no están vacíos (`ls -l frontend/public/fonts`).

- [ ] **Step 3: Escribir `frontend/index.html`** (con anti-FOUC)

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vesta Web</title>
    <script>
      // Aplica el tema guardado antes del primer paint para evitar parpadeo (FOUC).
      (function () {
        try {
          var p = localStorage.getItem('vesta-theme') || 'system';
          var dark =
            p === 'dark' ||
            (p === 'system' &&
              window.matchMedia('(prefers-color-scheme: dark)').matches);
          document.documentElement.dataset.theme = dark ? 'dark' : 'light';
        } catch (e) {
          document.documentElement.dataset.theme = 'dark';
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Escribir `frontend/src/index.css`** (tokens + reset — copiado verbatim de initFront, es la fuente de verdad del design system)

```css
/* Fuentes self-hosted (sin Google Fonts en runtime: app local self-hosted). */
@font-face {
  font-family: 'Outfit';
  src: url('/fonts/outfit.woff2') format('woff2');
  font-weight: 300 800;
  font-display: swap;
  font-style: normal;
}
@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/fonts/plus-jakarta-sans.woff2') format('woff2');
  font-weight: 300 800;
  font-display: swap;
  font-style: normal;
}

:root {
  --bg: #020b0c;
  --surface: #062325;
  --surface-raised: #0d3d41;
  --border: #164a4e;
  --ink: #ffffff;
  --body: #bacac1;
  --muted: #a0b1b2;

  --primary: #00d09e;
  --primary-bright: #44edb9;
  --primary-on: #00332a;
  --negative: #ff4b4b;
  --negative-on: #ffffff;

  --cat-1: #44edb9;
  --cat-2: #b2c5ff;
  --cat-3: #b9d5ff;
  --cat-4: #0d7c6a;
  --cat-5: #6f8fd6;
  --cat-6: #3a5a99;

  --focus-ring: color-mix(in oklch, var(--primary) 55%, transparent);
  --shadow-raised: 0 8px 24px rgb(0 0 0 / 0.35);

  --font-display: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  --text-xs: 0.6875rem;
  --text-sm: 0.75rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-display: 3rem;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-8: 3rem;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

  --z-sticky: 100;
  --z-dropdown: 200;
  --z-modal: 300;
  --z-toast: 400;

  color-scheme: dark;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--body);
  background: var(--bg);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

[data-theme='light'] {
  --bg: #f4fafa;
  --surface: #ffffff;
  --surface-raised: #e4f0f0;
  --border: #cbe0e0;
  --ink: #04211f;
  --body: #123634;
  --muted: #4c6664;

  --primary: #00795c;
  --primary-bright: #00795c;
  --primary-on: #ffffff;
  --negative: #c0362f;
  --negative-on: #ffffff;

  --cat-1: #00795c;
  --cat-2: #3b5bc0;
  --cat-3: #5b76c8;
  --cat-4: #0d9c84;
  --cat-5: #8a6bd0;
  --cat-6: #c07c2f;

  --shadow-raised: 0 8px 24px rgb(2 33 31 / 0.1);
  color-scheme: light;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100svh;
}

#root {
  min-height: 100svh;
}

h1,
h2,
h3,
h4 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
}

p {
  margin: 0;
}

button {
  font: inherit;
  color: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

.num {
  font-variant-numeric: tabular-nums;
}

:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 5: Escribir `frontend/src/lib/useTheme.ts`** (copiado verbatim de initFront)

```ts
import { useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'vesta-theme'

function readPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') return prefersDark() ? 'dark' : 'light'
  return pref
}

export function applyTheme(pref: ThemePreference): void {
  document.documentElement.dataset.theme = resolveTheme(pref)
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = () => {
    if (readPreference() === 'system') {
      applyTheme('system')
      emit()
    }
  }
  media.addEventListener('change', onSystemChange)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', onSystemChange)
  }
}

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => 'system' as ThemePreference)
  const setPreference = (pref: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, pref)
    applyTheme(pref)
    emit()
  }
  return { preference, resolved: resolveTheme(preference), setPreference }
}
```

- [ ] **Step 6: Escribir `frontend/src/main.tsx`** (temporal — se cablea el router en Task 6)

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ padding: '2rem' }}>
      <h1>Vesta Web</h1>
      <p className="num">1.234,56 €</p>
    </div>
  </StrictMode>,
)
```

- [ ] **Step 7: Limpiar scaffold sobrante**

Run:
```bash
cd frontend && rm -f src/App.css src/App.tsx src/assets/react.svg src/assets/vite.svg src/assets/hero.png
```
Expected: no quedan restos del scaffold Vite por defecto.

- [ ] **Step 8: Verificar build + arranque**

Run:
```bash
cd frontend && bun run build && bun run lint
```
Expected: build y lint sin errores. Además `bun run dev` muestra "Vesta Web" con fondo teal oscuro y la cifra en Outfit/tabular. Cambiar el tema del SO (o `localStorage.setItem('vesta-theme','light')` + recarga) conmuta a claro.

- [ ] **Step 9: Commit**

```bash
git add frontend/package.json frontend/bun.lock frontend/index.html frontend/public frontend/src
git commit -m "feat(front): scaffold — tokens, fuentes, tema y deps (recharts, router)"
```

---

## Task 2: Formateadores y modelo de rango

**Files:**
- Create: `frontend/src/lib/format.ts` (copiado verbatim de initFront)
- Create: `frontend/src/lib/range.ts`
- Test: `frontend/src/lib/range.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `format.ts`: `formatCurrency(n)`, `formatPercent(fraction)`, `formatDayLabel(Date)`, `formatMonthLabel(Date)`, `formatRelativeDateTime(string|Date)`, `formatFullDate(string|Date)`.
  - `range.ts`: `type Range = '1D'|'1S'|'1M'|'3M'|'6M'|'1A'|'3A'|'Todo'`; `RANGES: Range[]`; `RANGE_DAYS: Record<Range, number>`; `rangeStart(range: Range, now?: Date): number` (epoch ms del inicio de la ventana; `Todo` → `-Infinity`).

- [ ] **Step 1: Escribir `frontend/src/lib/format.ts`** (verbatim de initFront)

```ts
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('es-ES', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'short' })
const dayFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })

export const formatCurrency = (amount: number): string => currencyFormatter.format(amount)
export const formatPercent = (fraction: number): string => percentFormatter.format(fraction)
export const formatMonthLabel = (date: Date): string => monthFormatter.format(date)
export const formatDayLabel = (date: Date): string => dayFormatter.format(date)

const timeFormatter = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })
const fullDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatRelativeDateTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  const time = timeFormatter.format(date)
  if (dayDiff === 0) return `Hoy, ${time}`
  if (dayDiff === 1) return `Ayer, ${time}`
  return `${dayFormatter.format(date)}, ${time}`
}

export const formatFullDate = (input: string | Date): string =>
  fullDateFormatter.format(typeof input === 'string' ? new Date(input) : input)
```

- [ ] **Step 2: Escribir el test de `range.ts` (falla primero)** — `frontend/src/lib/range.test.ts`

```ts
import { test, expect } from 'bun:test'
import { RANGES, RANGE_DAYS, rangeStart } from './range'

const DAY = 86_400_000
const NOW = new Date('2026-07-05T00:00:00Z')

test('RANGES en orden esperado', () => {
  expect(RANGES).toEqual(['1D', '1S', '1M', '3M', '6M', '1A', '3A', 'Todo'])
})

test('rangeStart resta los días correctos', () => {
  expect(rangeStart('1D', NOW)).toBe(NOW.getTime() - 1 * DAY)
  expect(rangeStart('1S', NOW)).toBe(NOW.getTime() - 7 * DAY)
  expect(rangeStart('1A', NOW)).toBe(NOW.getTime() - RANGE_DAYS['1A'] * DAY)
})

test('rangeStart("Todo") es -Infinity', () => {
  expect(rangeStart('Todo', NOW)).toBe(-Infinity)
})
```

- [ ] **Step 3: Ejecutar el test para verlo fallar**

Run: `cd frontend && bun test src/lib/range.test.ts`
Expected: FAIL (`Cannot find module './range'`).

- [ ] **Step 4: Escribir `frontend/src/lib/range.ts`**

```ts
/** Ventanas temporales del selector de rango; controlan gráfico y agregación. */
export type Range = '1D' | '1S' | '1M' | '3M' | '6M' | '1A' | '3A' | 'Todo'

export const RANGES: Range[] = ['1D', '1S', '1M', '3M', '6M', '1A', '3A', 'Todo']

export const RANGE_DAYS: Record<Range, number> = {
  '1D': 1,
  '1S': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1A': 365,
  '3A': 1095,
  Todo: Infinity,
}

const DAY = 86_400_000

/** Epoch ms del inicio de la ventana. 'Todo' → -Infinity (sin recorte). */
export function rangeStart(range: Range, now: Date = new Date()): number {
  const days = RANGE_DAYS[range]
  return days === Infinity ? -Infinity : now.getTime() - days * DAY
}
```

- [ ] **Step 5: Ejecutar el test para verlo pasar**

Run: `cd frontend && bun test src/lib/range.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/format.ts frontend/src/lib/range.ts frontend/src/lib/range.test.ts
git commit -m "feat(front): formateadores es-ES y modelo de rango temporal"
```

---

## Task 3: Datos mock deterministas

**Files:**
- Create: `frontend/src/lib/mock.ts`
- Test: `frontend/src/lib/mock.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces (tipos y datos):
  - `type Category = { id: string; name: string; color: string }`
  - `type Movement = { id: string; date: string; amount: number; categoryId: string; description: string }` (amount>0 ingreso, <0 gasto)
  - `type AssetClass = 'ETF' | 'Acciones' | 'Oro' | 'Cripto'`
  - `type Asset = { id: string; name: string; ticker: string; class: AssetClass; shares: number; avgCost: number; currentPrice: number; vol: number }`
  - `type AssetTx = { id: string; date: string; type: 'compra' | 'venta'; shares: number; price: number; fee: number }`
  - `type Point = { t: number; v: number }` (t epoch ms, v valor)
  - `categories: Category[]`, `movements: Movement[]`, `assets: Asset[]`
  - `priceHistory(assetId: string, days?: number): Point[]`
  - `portfolioValueSeries(days?: number): Point[]` (Σ shares·precio por día)
  - `assetTransactions(assetId: string): AssetTx[]`
  - `HISTORY_DAYS = 1095`

- [ ] **Step 1: Escribir el test (falla primero)** — `frontend/src/lib/mock.test.ts`

```ts
import { test, expect } from 'bun:test'
import {
  categories,
  movements,
  assets,
  priceHistory,
  portfolioValueSeries,
  assetTransactions,
  HISTORY_DAYS,
} from './mock'

test('categorías y activos no vacíos', () => {
  expect(categories.length).toBeGreaterThan(0)
  expect(assets.length).toBeGreaterThan(0)
})

test('todo movimiento referencia una categoría válida', () => {
  const ids = new Set(categories.map((c) => c.id))
  for (const m of movements) expect(ids.has(m.categoryId)).toBe(true)
})

test('hay ingresos y gastos', () => {
  expect(movements.some((m) => m.amount > 0)).toBe(true)
  expect(movements.some((m) => m.amount < 0)).toBe(true)
})

test('priceHistory termina en el precio actual y tiene HISTORY_DAYS puntos', () => {
  const a = assets[0]
  const h = priceHistory(a.id)
  expect(h.length).toBe(HISTORY_DAYS)
  expect(Math.abs(h[h.length - 1].v - a.currentPrice)).toBeLessThan(0.01)
})

test('priceHistory es determinista', () => {
  expect(priceHistory('vwce')).toEqual(priceHistory('vwce'))
})

test('portfolioValueSeries último punto = Σ shares·currentPrice', () => {
  const s = portfolioValueSeries()
  const expected = assets.reduce((acc, a) => acc + a.shares * a.currentPrice, 0)
  expect(Math.abs(s[s.length - 1].v - expected)).toBeLessThan(1)
})

test('assetTransactions devuelve al menos una compra', () => {
  const txs = assetTransactions('vwce')
  expect(txs.some((t) => t.type === 'compra')).toBe(true)
})
```

- [ ] **Step 2: Ejecutar el test para verlo fallar**

Run: `cd frontend && bun test src/lib/mock.test.ts`
Expected: FAIL (`Cannot find module './mock'`).

- [ ] **Step 3: Escribir `frontend/src/lib/mock.ts`**

```ts
/**
 * Datos inventados deterministas para la fase de solo-frontend. Todo se genera
 * con un PRNG sembrado (mulberry32) para que las cifras sean estables entre
 * recargas. Las fechas se anclan a "hoy" para que los rangos cortos (1D/1S)
 * tengan datos recientes que mostrar.
 */
export type Category = { id: string; name: string; color: string }
export type Movement = {
  id: string
  date: string
  amount: number
  categoryId: string
  description: string
}
export type AssetClass = 'ETF' | 'Acciones' | 'Oro' | 'Cripto'
export type Asset = {
  id: string
  name: string
  ticker: string
  class: AssetClass
  shares: number
  avgCost: number
  currentPrice: number
  vol: number
}
export type AssetTx = {
  id: string
  date: string
  type: 'compra' | 'venta'
  shares: number
  price: number
  fee: number
}
export type Point = { t: number; v: number }

export const HISTORY_DAYS = 1095
const DAY = 86_400_000

/** PRNG determinista. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStr(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Epoch ms de las 00:00 de hoy (hora local). */
function todayMid(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const round2 = (n: number) => Math.round(n * 100) / 100

// --- Categorías (colores = tokens de categoría, van a los segmentos del donut) ---
export const categories: Category[] = [
  { id: 'nomina', name: 'Nómina', color: 'var(--primary)' },
  { id: 'vivienda', name: 'Vivienda', color: 'var(--cat-2)' },
  { id: 'alimentacion', name: 'Alimentación', color: 'var(--cat-3)' },
  { id: 'transporte', name: 'Transporte', color: 'var(--cat-4)' },
  { id: 'ocio', name: 'Ocio', color: 'var(--cat-5)' },
  { id: 'otros', name: 'Otros', color: 'var(--cat-6)' },
]

const EXPENSE_CATS: { id: string; base: number; desc: string[] }[] = [
  { id: 'alimentacion', base: 55, desc: ['Supermercado', 'Frutería', 'Panadería'] },
  { id: 'transporte', base: 22, desc: ['Gasolina', 'Metro', 'Taxi'] },
  { id: 'ocio', base: 38, desc: ['Cine', 'Restaurante', 'Suscripción'] },
  { id: 'otros', base: 30, desc: ['Farmacia', 'Ropa', 'Varios'] },
]

// --- Movimientos: 3 años de historia ---
function genMovements(): Movement[] {
  const rand = mulberry32(1337)
  const out: Movement[] = []
  const t0 = todayMid()
  let id = 0
  for (let d = HISTORY_DAYS - 1; d >= 0; d--) {
    const ms = t0 - d * DAY
    const date = new Date(ms)
    const iso = date.toISOString()
    if (date.getDate() === 1) {
      out.push({
        id: `m${id++}`,
        date: iso,
        amount: round2(2400 + rand() * 200),
        categoryId: 'nomina',
        description: 'Nómina mensual',
      })
      out.push({
        id: `m${id++}`,
        date: iso,
        amount: -round2(740 + rand() * 40),
        categoryId: 'vivienda',
        description: 'Alquiler',
      })
    }
    const n = rand() < 0.55 ? (rand() < 0.3 ? 2 : 1) : 0
    for (let k = 0; k < n; k++) {
      const cat = EXPENSE_CATS[Math.floor(rand() * EXPENSE_CATS.length)]
      out.push({
        id: `m${id++}`,
        date: iso,
        amount: -round2(cat.base * 0.4 + rand() * cat.base),
        categoryId: cat.id,
        description: cat.desc[Math.floor(rand() * cat.desc.length)],
      })
    }
  }
  return out
}

export const movements: Movement[] = genMovements()

// --- Activos ---
export const assets: Asset[] = [
  { id: 'vwce', name: 'Vanguard FTSE All-World', ticker: 'VWCE', class: 'ETF', shares: 120, avgCost: 98.4, currentPrice: 112.35, vol: 0.011 },
  { id: 'sxr8', name: 'iShares Core S&P 500', ticker: 'SXR8', class: 'ETF', shares: 15, avgCost: 420.1, currentPrice: 512.8, vol: 0.012 },
  { id: 'aapl', name: 'Apple Inc.', ticker: 'AAPL', class: 'Acciones', shares: 40, avgCost: 155.2, currentPrice: 214.6, vol: 0.018 },
  { id: 'msft', name: 'Microsoft Corp.', ticker: 'MSFT', class: 'Acciones', shares: 12, avgCost: 305.0, currentPrice: 448.9, vol: 0.017 },
  { id: 'gold', name: 'Oro físico (g)', ticker: 'XAU', class: 'Oro', shares: 200, avgCost: 55.3, currentPrice: 72.1, vol: 0.008 },
  { id: 'btc', name: 'Bitcoin', ticker: 'BTC', class: 'Cripto', shares: 0.35, avgCost: 41200, currentPrice: 58400, vol: 0.03 },
]

/**
 * Cotización histórica diaria de un activo: paseo aleatorio multiplicativo
 * sembrado por el id, escalado para terminar exactamente en `currentPrice`.
 */
export function priceHistory(assetId: string, days = HISTORY_DAYS): Point[] {
  const asset = assets.find((a) => a.id === assetId)
  if (!asset) return []
  const rand = mulberry32(hashStr(assetId))
  const logs: number[] = []
  let logp = 0
  for (let i = 0; i < days; i++) {
    logp += (rand() - 0.5) * asset.vol
    logs.push(logp)
  }
  const last = logs[logs.length - 1]
  const t0 = todayMid() - (days - 1) * DAY
  return logs.map((s, i) => ({ t: t0 + i * DAY, v: asset.currentPrice * Math.exp(s - last) }))
}

/** Valor diario de la cartera = Σ (shares · cotización) alineado por día. */
export function portfolioValueSeries(days = HISTORY_DAYS): Point[] {
  const series = assets.map((a) => ({ shares: a.shares, hist: priceHistory(a.id, days) }))
  const out: Point[] = []
  for (let i = 0; i < days; i++) {
    let v = 0
    for (const s of series) v += s.shares * s.hist[i].v
    out.push({ t: series[0].hist[i].t, v })
  }
  return out
}

/** Historial de transacciones registradas de un activo. */
export function assetTransactions(assetId: string): AssetTx[] {
  const asset = assets.find((a) => a.id === assetId)
  if (!asset) return []
  const rand = mulberry32(hashStr(assetId) ^ 0x9e3779b9)
  const t0 = todayMid()
  const nBuys = 2 + Math.floor(rand() * 3)
  const txs: AssetTx[] = []
  for (let i = 0; i < nBuys; i++) {
    const daysAgo = Math.floor(rand() * HISTORY_DAYS)
    txs.push({
      id: `${assetId}-tx${i}`,
      date: new Date(t0 - daysAgo * DAY).toISOString(),
      type: rand() < 0.85 ? 'compra' : 'venta',
      shares: round2((asset.shares / nBuys) * (0.5 + rand())),
      price: round2(asset.avgCost * (0.85 + rand() * 0.4)),
      fee: round2(1 + rand() * 4),
    })
  }
  return txs.sort((a, b) => +new Date(b.date) - +new Date(a.date))
}
```

- [ ] **Step 4: Ejecutar el test para verlo pasar**

Run: `cd frontend && bun test src/lib/mock.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/mock.ts frontend/src/lib/mock.test.ts
git commit -m "feat(front): datos mock deterministas (movimientos, activos, cotizaciones)"
```

---

## Task 4: Agregación cliente

**Files:**
- Create: `frontend/src/lib/aggregate.ts`
- Test: `frontend/src/lib/aggregate.test.ts`

**Interfaces:**
- Consumes: `mock.ts` (`Movement`, `Asset`, `Category`, `Point`, `movements`, `assets`, `categories`, `priceHistory`, `portfolioValueSeries`), `range.ts` (`Range`, `rangeStart`).
- Produces:
  - `type Segment = { label: string; value: number; color: string }`
  - `type Metrics = { marketValue: number; cost: number; pnl: number; pnlPct: number }`
  - `filterMovements(range: Range): Movement[]`
  - `filterPoints(points: Point[], range: Range): Point[]`
  - `monthMovements(year: number, month: number): Movement[]` (month 0-11)
  - `sumIngresos(ms: Movement[]): number`
  - `sumGastos(ms: Movement[]): number` (positivo)
  - `balanceNeto(ms: Movement[]): number`
  - `gastosPorCategoria(ms: Movement[]): Segment[]`
  - `distribucionPorClase(): Segment[]`
  - `patrimonioSeries(range: Range): Point[]`
  - `capitalInvertidoSeries(range: Range): Point[]`
  - `assetMetrics(asset: Asset): Metrics`
  - `totalCartera(): Metrics`

- [ ] **Step 1: Escribir el test (falla primero)** — `frontend/src/lib/aggregate.test.ts`

```ts
import { test, expect } from 'bun:test'
import { assets } from './mock'
import {
  sumIngresos,
  sumGastos,
  balanceNeto,
  assetMetrics,
  totalCartera,
  distribucionPorClase,
  gastosPorCategoria,
  filterMovements,
} from './aggregate'

const ms = [
  { id: 'a', date: '2026-07-01T00:00:00Z', amount: 1000, categoryId: 'nomina', description: '' },
  { id: 'b', date: '2026-07-02T00:00:00Z', amount: -200, categoryId: 'ocio', description: '' },
  { id: 'c', date: '2026-07-03T00:00:00Z', amount: -50, categoryId: 'ocio', description: '' },
]

test('sumas de ingresos/gastos/balance', () => {
  expect(sumIngresos(ms)).toBe(1000)
  expect(sumGastos(ms)).toBe(250)
  expect(balanceNeto(ms)).toBe(750)
})

test('gastosPorCategoria agrupa y suma en positivo', () => {
  const segs = gastosPorCategoria(ms)
  const ocio = segs.find((s) => s.label === 'Ocio')
  expect(ocio?.value).toBe(250)
})

test('assetMetrics calcula valor de mercado y P/L', () => {
  const a = assets.find((x) => x.id === 'vwce')!
  const m = assetMetrics(a)
  expect(m.marketValue).toBeCloseTo(a.shares * a.currentPrice, 6)
  expect(m.cost).toBeCloseTo(a.shares * a.avgCost, 6)
  expect(m.pnl).toBeCloseTo((a.currentPrice - a.avgCost) * a.shares, 6)
  expect(m.pnlPct).toBeCloseTo(m.pnl / m.cost, 6)
})

test('totalCartera = Σ valores de mercado', () => {
  const t = totalCartera()
  const expected = assets.reduce((acc, a) => acc + a.shares * a.currentPrice, 0)
  expect(t.marketValue).toBeCloseTo(expected, 4)
})

test('distribucionPorClase suma al valor total de la cartera', () => {
  const segs = distribucionPorClase()
  const sum = segs.reduce((acc, s) => acc + s.value, 0)
  expect(sum).toBeCloseTo(totalCartera().marketValue, 4)
})

test('filterMovements("1S") solo devuelve la última semana', () => {
  const within = filterMovements('1S')
  const cutoff = Date.now() - 8 * 86_400_000
  expect(within.every((m) => +new Date(m.date) >= cutoff)).toBe(true)
})
```

- [ ] **Step 2: Ejecutar el test para verlo fallar**

Run: `cd frontend && bun test src/lib/aggregate.test.ts`
Expected: FAIL (`Cannot find module './aggregate'`).

- [ ] **Step 3: Escribir `frontend/src/lib/aggregate.ts`**

```ts
/**
 * Agregación cliente sobre los datos mock: sumas de movimientos, series
 * temporales (patrimonio, capital invertido), desgloses (donut) y métricas
 * de cartera. Todo derivado — sin estado propio.
 */
import {
  assets,
  categories,
  movements,
  portfolioValueSeries,
  type Asset,
  type Movement,
  type Point,
} from './mock'
import { rangeStart, type Range } from './range'

export type Segment = { label: string; value: number; color: string }
export type Metrics = { marketValue: number; cost: number; pnl: number; pnlPct: number }

const catById = new Map(categories.map((c) => [c.id, c]))

/** Movimientos dentro de la ventana del rango. */
export function filterMovements(range: Range): Movement[] {
  const start = rangeStart(range)
  return movements.filter((m) => +new Date(m.date) >= start)
}

/** Puntos de una serie dentro de la ventana del rango. */
export function filterPoints(points: Point[], range: Range): Point[] {
  const start = rangeStart(range)
  return points.filter((p) => p.t >= start)
}

/** Movimientos de un mes concreto (month 0-11). */
export function monthMovements(year: number, month: number): Movement[] {
  return movements.filter((m) => {
    const d = new Date(m.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
}

export const sumIngresos = (ms: Movement[]): number =>
  ms.reduce((acc, m) => (m.amount > 0 ? acc + m.amount : acc), 0)

export const sumGastos = (ms: Movement[]): number =>
  ms.reduce((acc, m) => (m.amount < 0 ? acc - m.amount : acc), 0)

export const balanceNeto = (ms: Movement[]): number =>
  ms.reduce((acc, m) => acc + m.amount, 0)

/** Gasto agrupado por categoría (valores positivos), ordenado desc. */
export function gastosPorCategoria(ms: Movement[]): Segment[] {
  const totals = new Map<string, number>()
  for (const m of ms) {
    if (m.amount >= 0) continue
    totals.set(m.categoryId, (totals.get(m.categoryId) ?? 0) - m.amount)
  }
  return [...totals.entries()]
    .map(([id, value]) => ({
      label: catById.get(id)?.name ?? id,
      value,
      color: catById.get(id)?.color ?? 'var(--cat-6)',
    }))
    .sort((a, b) => b.value - a.value)
}

const CLASS_COLOR: Record<string, string> = {
  ETF: 'var(--cat-1)',
  Acciones: 'var(--cat-2)',
  Oro: 'var(--cat-4)',
  Cripto: 'var(--cat-5)',
}

/** Distribución del valor de mercado por clase de activo. */
export function distribucionPorClase(): Segment[] {
  const totals = new Map<string, number>()
  for (const a of assets) {
    totals.set(a.class, (totals.get(a.class) ?? 0) + a.shares * a.currentPrice)
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value, color: CLASS_COLOR[label] ?? 'var(--cat-6)' }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Patrimonio total a lo largo del tiempo = liquidez acumulada (Σ movimientos
 * hasta cada día) + valor de la cartera ese día. Alineado por día con la
 * serie de cartera; recortado al rango.
 */
export function patrimonioSeries(range: Range): Point[] {
  const cartera = portfolioValueSeries()
  // Liquidez acumulada por día: suma de movimientos con fecha <= día.
  const sorted = [...movements].sort((a, b) => +new Date(a.date) - +new Date(b.date))
  let idx = 0
  let liquidez = 0
  const out: Point[] = cartera.map((p) => {
    while (idx < sorted.length && +new Date(sorted[idx].date) <= p.t + 86_400_000 - 1) {
      liquidez += sorted[idx].amount
      idx++
    }
    return { t: p.t, v: liquidez + p.v }
  })
  return filterPoints(out, range)
}

/** Evolución del valor de la cartera, recortada al rango. */
export function capitalInvertidoSeries(range: Range): Point[] {
  return filterPoints(portfolioValueSeries(), range)
}

/** Métricas de un activo. */
export function assetMetrics(asset: Asset): Metrics {
  const marketValue = asset.shares * asset.currentPrice
  const cost = asset.shares * asset.avgCost
  const pnl = marketValue - cost
  return { marketValue, cost, pnl, pnlPct: cost === 0 ? 0 : pnl / cost }
}

/** Métricas agregadas de toda la cartera. */
export function totalCartera(): Metrics {
  const acc = assets.reduce(
    (a, asset) => {
      const m = assetMetrics(asset)
      a.marketValue += m.marketValue
      a.cost += m.cost
      return a
    },
    { marketValue: 0, cost: 0 },
  )
  const pnl = acc.marketValue - acc.cost
  return { ...acc, pnl, pnlPct: acc.cost === 0 ? 0 : pnl / acc.cost }
}
```

- [ ] **Step 4: Ejecutar el test para verlo pasar**

Run: `cd frontend && bun test src/lib/aggregate.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/aggregate.ts frontend/src/lib/aggregate.test.ts
git commit -m "feat(front): agregación cliente (sumas, series, desgloses, métricas)"
```

---

## Task 5: Iconos y gráficos (Recharts)

**Files:**
- Create: `frontend/src/lib/icons.tsx`, `frontend/src/charts/RangeSelector.tsx`, `frontend/src/charts/AreaTrend.tsx`, `frontend/src/charts/Donut.tsx`, `frontend/src/charts/charts.css`

**Interfaces:**
- Consumes: `range.ts` (`Range`, `RANGES`), `mock.ts` (`Point`, `Segment` via aggregate), `format.ts`.
- Produces:
  - `icons.tsx`: `IconDashboard`, `IconMovements`, `IconWallet`, `IconSun`, `IconMoon`, `IconArrow` (props `{ size?: number }`), `IconChevron` (prop `{ dir: 'left' | 'right' }`).
  - `RangeSelector`: `({ value: Range; onChange: (r: Range) => void })`.
  - `AreaTrend`: `({ data: Point[]; color?: string; height?: number; valueFmt?: (n: number) => string })`.
  - `Donut`: `({ data: Segment[]; valueFmt?: (n: number) => string })` (Segment = `{ label; value; color }`).

- [ ] **Step 1: Escribir `frontend/src/lib/icons.tsx`**

```tsx
type IconProps = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const IconDashboard = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
)

export const IconMovements = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 7h13l-3-3M20 17H7l3 3" />
  </svg>
)

export const IconWallet = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18M16 14h2" />
  </svg>
)

export const IconSun = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const IconMoon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
)

export const IconArrow = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 5v14M6 11l6-6 6 6" />
  </svg>
)

export const IconChevron = ({ dir = 'right', size = 18 }: IconProps & { dir?: 'left' | 'right' }) => (
  <svg {...base(size)} style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)
```

- [ ] **Step 2: Escribir `frontend/src/charts/RangeSelector.tsx`**

```tsx
import { RANGES, type Range } from '../lib/range'
import './charts.css'

/** Selector de ventana temporal: controla gráfico y agregación a la vez. */
export function RangeSelector({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="range-selector" role="tablist" aria-label="Rango temporal">
      {RANGES.map((r) => (
        <button
          key={r}
          role="tab"
          aria-selected={r === value}
          className={r === value ? 'range-btn is-active' : 'range-btn'}
          onClick={() => onChange(r)}
        >
          {r}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Escribir `frontend/src/charts/AreaTrend.tsx`**

```tsx
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Point } from '../lib/mock'
import { formatCurrency, formatDayLabel } from '../lib/format'

type Props = {
  data: Point[]
  color?: string
  height?: number
  valueFmt?: (n: number) => string
}

/** Gráfico de área/línea para series temporales, tematizado con tokens. */
export function AreaTrend({ data, color = 'var(--primary)', height = 300, valueFmt = formatCurrency }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="t"
          type="number"
          domain={['dataMin', 'dataMax']}
          scale="time"
          tickFormatter={(t) => formatDayLabel(new Date(t))}
          tick={{ fill: 'var(--muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={48}
        />
        <YAxis
          dataKey="v"
          domain={['auto', 'auto']}
          tick={{ fill: 'var(--muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={54}
          tickFormatter={(v) => valueFmt(v)}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
          labelFormatter={(t) => formatDayLabel(new Date(Number(t)))}
          formatter={(v: number) => [valueFmt(v), '']}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill="url(#areaFill)"
          dot={false}
          activeDot={{ r: 4, fill: color }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 4: Escribir `frontend/src/charts/Donut.tsx`**

```tsx
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Segment } from '../lib/aggregate'
import { formatCurrency } from '../lib/format'

type Props = { data: Segment[]; valueFmt?: (n: number) => string }

/** Donut de desglose (gastos por categoría, distribución por clase). */
export function Donut({ data, valueFmt = formatCurrency }: Props) {
  const total = data.reduce((acc, s) => acc + s.value, 0)
  return (
    <div className="donut">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={64}
            outerRadius={92}
            paddingAngle={2}
            stroke="var(--surface)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((s) => (
              <Cell key={s.label} fill={s.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--ink)',
              fontVariantNumeric: 'tabular-nums',
            }}
            formatter={(v: number, label) => [valueFmt(v), label as string]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="donut-legend">
        {data.map((s) => (
          <li key={s.label}>
            <span className="donut-dot" style={{ background: s.color }} />
            <span className="donut-label">{s.label}</span>
            <span className="donut-val num">{valueFmt(s.value)}</span>
            <span className="donut-pct num">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 5: Escribir `frontend/src/charts/charts.css`**

```css
.range-selector {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
}
.range-btn {
  padding: var(--space-1) var(--space-3);
  border: none;
  background: transparent;
  color: var(--muted);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s var(--ease-out-expo), background 0.15s var(--ease-out-expo);
}
.range-btn:hover {
  color: var(--ink);
}
.range-btn.is-active {
  background: var(--primary);
  color: var(--primary-on);
}

.donut {
  display: grid;
  gap: var(--space-4);
}
.donut-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}
.donut-legend li {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
}
.donut-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
}
.donut-label {
  color: var(--body);
}
.donut-val {
  color: var(--ink);
  font-weight: 600;
}
.donut-pct {
  color: var(--muted);
  min-width: 3ch;
  text-align: right;
}

/* Recharts: quitar el rectángulo de foco por defecto en el tooltip cursor */
.recharts-tooltip-cursor {
  fill: var(--surface-raised);
  opacity: 0.4;
}
```

- [ ] **Step 6: Verificar build + lint**

Run: `cd frontend && bun run build && bun run lint`
Expected: sin errores de tipos ni de lint (los componentes aún no se renderizan; la verificación visual llega en Task 7).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/icons.tsx frontend/src/charts
git commit -m "feat(front): iconos y gráficos Recharts (rango, área, donut) tematizados"
```

---

## Task 6: App-shell y router

**Files:**
- Create: `frontend/src/app/AppLayout.tsx`, `frontend/src/app/StatCard.tsx`, `frontend/src/app/Card.tsx`, `frontend/src/app/app.css`, `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

**Interfaces:**
- Consumes: `useTheme.ts`, `icons.tsx`, `react-router-dom`.
- Produces:
  - `AppLayout` (usa `<Outlet/>`, deriva el título de la ruta).
  - `StatCard`: `({ label: string; value: string; tone?: 'neutral' | 'positive' | 'negative'; sub?: string })`.
  - `Card`: `({ title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string })`.
  - Rutas registradas: `/`, `/movimientos`, `/cartera`, `/cartera/:id`.

- [ ] **Step 1: Escribir `frontend/src/app/Card.tsx`**

```tsx
import type { ReactNode } from 'react'

/** Panel de sección: cabecera opcional (título + acción) y contenido. */
export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className ? `card ${className}` : 'card'}>
      {(title || action) && (
        <header className="card-head">
          {title && <h3 className="card-title">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
```

- [ ] **Step 2: Escribir `frontend/src/app/StatCard.tsx`**

```tsx
/** Tarjeta de métrica: etiqueta, cifra grande (tabular) y subtexto opcional. */
export function StatCard({
  label,
  value,
  tone = 'neutral',
  sub,
}: {
  label: string
  value: string
  tone?: 'neutral' | 'positive' | 'negative'
  sub?: string
}) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value num tone-${tone}`}>{value}</span>
      {sub && <span className={`stat-sub num tone-${tone}`}>{sub}</span>}
    </div>
  )
}
```

- [ ] **Step 3: Escribir `frontend/src/app/AppLayout.tsx`**

```tsx
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../lib/useTheme'
import { IconDashboard, IconMovements, IconMoon, IconSun, IconWallet } from '../lib/icons'

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

export function AppLayout() {
  const { resolved, setPreference } = useTheme()
  const { pathname } = useLocation()
  const isDark = resolved === 'dark'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">V</span>
          <span className="brand-name">Vesta</span>
        </div>
        <nav className="nav">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'nav-item is-active' : 'nav-item')}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="theme-toggle"
          onClick={() => setPreference(isDark ? 'light' : 'dark')}
          aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {isDark ? <IconSun /> : <IconMoon />}
          <span>{isDark ? 'Claro' : 'Oscuro'}</span>
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1 className="topbar-title">{titleFor(pathname)}</h1>
          <div className="topbar-actions" aria-hidden="true">
            {/* Perfil y ajustes: placeholders sin implementar por ahora. */}
            <span className="topbar-chip" />
            <span className="topbar-chip" />
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Escribir `frontend/src/app/app.css`**

```css
.app-shell {
  display: grid;
  grid-template-columns: 232px 1fr;
  min-height: 100svh;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-4);
  background: var(--surface);
  border-right: 1px solid var(--border);
  position: sticky;
  top: 0;
  height: 100svh;
}
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-2);
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--primary-on);
  font-family: var(--font-display);
  font-weight: 700;
}
.brand-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-lg);
  color: var(--ink);
}
.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--body);
  font-weight: 600;
  font-size: var(--text-sm);
  transition: background 0.15s var(--ease-out-expo), color 0.15s var(--ease-out-expo);
}
.nav-item:hover {
  background: var(--surface-raised);
  color: var(--ink);
}
.nav-item.is-active {
  background: var(--surface-raised);
  color: var(--primary);
}
.theme-toggle {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--body);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}
.theme-toggle:hover {
  color: var(--ink);
  border-color: var(--primary);
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(8px);
  z-index: var(--z-sticky);
}
.topbar-title {
  font-size: var(--text-2xl);
}
.topbar-actions {
  display: flex;
  gap: var(--space-3);
}
.topbar-chip {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--surface-raised);
  border: 1px solid var(--border);
}

.content {
  padding: var(--space-6);
  display: grid;
  gap: var(--space-5);
  max-width: 1200px;
  width: 100%;
}

/* --- Piezas compartidas --- */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: grid;
  gap: var(--space-4);
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.card-title {
  font-size: var(--text-lg);
}
.stat-card {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.stat-label {
  font-size: var(--text-sm);
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.stat-value {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--ink);
}
.stat-sub {
  font-size: var(--text-sm);
  color: var(--muted);
}
.tone-positive {
  color: var(--primary);
}
.tone-negative {
  color: var(--negative);
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

@media (max-width: 720px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
    height: auto;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
  .theme-toggle {
    margin-top: 0;
  }
}
```

- [ ] **Step 5: Escribir `frontend/src/App.tsx`** (router; usa placeholders temporales hasta Tasks 7-10)

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './app/AppLayout'
import './app/app.css'

const Placeholder = ({ name }: { name: string }) => <div className="card">{name} — en construcción</div>

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Placeholder name="Dashboard" /> },
      { path: 'movimientos', element: <Placeholder name="Movimientos" /> },
      { path: 'cartera', element: <Placeholder name="Cartera" /> },
      { path: 'cartera/:id', element: <Placeholder name="Detalle" /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
```

- [ ] **Step 6: Actualizar `frontend/src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Verificar build + navegación**

Run: `cd frontend && bun run build && bun run lint`
Expected: sin errores. En `bun run dev`: sidebar con logo Vesta + 3 items, click navega entre `/`, `/movimientos`, `/cartera` (item activo en verde), el toggle de tema conmuta claro/oscuro y persiste al recargar. La topbar muestra el título correcto por ruta.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat(front): app-shell (sidebar + topbar + tema) y router"
```

---

## Task 7: Pantalla Dashboard

**Files:**
- Create: `frontend/src/dashboard/Dashboard.tsx`, `frontend/src/dashboard/dashboard.css`
- Modify: `frontend/src/App.tsx` (montar `<Dashboard/>` en `index`)

**Interfaces:**
- Consumes: `RangeSelector`, `AreaTrend`, `Donut`, `Card`, `StatCard`, aggregate (`filterMovements`, `sumIngresos`, `sumGastos`, `balanceNeto`, `gastosPorCategoria`, `patrimonioSeries`, `totalCartera`), `mock` (`movements`, `categories`), `format`, `icons`.
- Produces: componente `Dashboard`.

- [ ] **Step 1: Escribir `frontend/src/dashboard/Dashboard.tsx`**

```tsx
import { useState } from 'react'
import { RangeSelector } from '../charts/RangeSelector'
import { AreaTrend } from '../charts/AreaTrend'
import { Donut } from '../charts/Donut'
import { Card } from '../app/Card'
import { StatCard } from '../app/StatCard'
import { IconArrow } from '../lib/icons'
import { categories, movements } from '../lib/mock'
import {
  balanceNeto,
  filterMovements,
  gastosPorCategoria,
  patrimonioSeries,
  sumGastos,
  sumIngresos,
  totalCartera,
} from '../lib/aggregate'
import { formatCurrency, formatRelativeDateTime } from '../lib/format'
import type { Range } from '../lib/range'
import './dashboard.css'

const catName = new Map(categories.map((c) => [c.id, c.name]))

export function Dashboard() {
  const [range, setRange] = useState<Range>('1A')
  const ms = filterMovements(range)
  const serie = patrimonioSeries(range)
  const patrimonioActual = serie.length ? serie[serie.length - 1].v : 0
  const cartera = totalCartera()
  const ingresos = sumIngresos(ms)
  const gastos = sumGastos(ms)
  const neto = balanceNeto(ms)
  const donut = gastosPorCategoria(ms)
  const ultimos = [...movements].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8)

  return (
    <>
      <Card
        title="Patrimonio total"
        action={<RangeSelector value={range} onChange={setRange} />}
        className="hero-card"
      >
        <p className="hero-figure num">{formatCurrency(patrimonioActual)}</p>
        <AreaTrend data={serie} height={320} />
      </Card>

      <div className="stat-row">
        <StatCard label="Capital invertido" value={formatCurrency(cartera.marketValue)} />
        <StatCard label={`Ingresos · ${range}`} value={formatCurrency(ingresos)} tone="positive" />
        <StatCard label={`Gastos · ${range}`} value={formatCurrency(gastos)} tone="negative" />
        <StatCard
          label={`Balance neto · ${range}`}
          value={formatCurrency(neto)}
          tone={neto >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <div className="dash-lower">
        <Card title="Gastos por categoría">
          <Donut data={donut} />
        </Card>

        <Card title="Últimos movimientos">
          <ul className="movement-list">
            {ultimos.map((m) => {
              const income = m.amount > 0
              return (
                <li key={m.id} className="movement">
                  <span className={`mv-icon ${income ? 'up' : 'down'}`}>
                    <IconArrow />
                  </span>
                  <span className="mv-main">
                    <span className="mv-desc">{m.description}</span>
                    <span className="mv-meta">
                      {catName.get(m.categoryId)} · {formatRelativeDateTime(m.date)}
                    </span>
                  </span>
                  <span className={`mv-amount num ${income ? 'tone-positive' : 'tone-negative'}`}>
                    {formatCurrency(m.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Escribir `frontend/src/dashboard/dashboard.css`**

```css
.hero-figure {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.1;
}

.dash-lower {
  display: grid;
  grid-template-columns: minmax(280px, 380px) 1fr;
  gap: var(--space-5);
  align-items: start;
}

.movement-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-1);
}
.movement {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  transition: background 0.15s var(--ease-out-expo);
}
.movement:hover {
  background: var(--surface-raised);
}
.mv-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  background: var(--surface-raised);
}
.mv-icon.up {
  color: var(--primary);
}
.mv-icon.down {
  color: var(--negative);
  transform: rotate(180deg);
}
.mv-main {
  display: grid;
  min-width: 0;
}
.mv-desc {
  color: var(--ink);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mv-meta {
  font-size: var(--text-sm);
  color: var(--muted);
}
.mv-amount {
  font-weight: 600;
}

@media (max-width: 900px) {
  .dash-lower {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Montar Dashboard en el router** — editar `frontend/src/App.tsx`

Reemplazar el import placeholder y la ruta `index`:
```tsx
import { Dashboard } from './dashboard/Dashboard'
// ...
{ index: true, element: <Dashboard /> },
```

- [ ] **Step 4: Verificar build + visual**

Run: `cd frontend && bun run build && bun run lint`
Expected: sin errores. En `bun run dev`, `/` muestra: hero con cifra display + `AreaTrend`, `RangeSelector` que al cambiar recalcula cifra/serie/stats, fila de 4 stats, donut de gastos por categoría con leyenda, y lista de últimos movimientos (verde ingresos ▲ / rojo gastos ▼). Probar varios rangos (1D, 1S, Todo) sin errores en consola.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/dashboard frontend/src/App.tsx
git commit -m "feat(front): pantalla Dashboard (patrimonio, stats, donut, movimientos)"
```

---

## Task 8: Pantalla Movimientos

**Files:**
- Create: `frontend/src/movimientos/Movimientos.tsx`, `frontend/src/movimientos/movimientos.css`
- Modify: `frontend/src/App.tsx` (montar `<Movimientos/>`)

**Interfaces:**
- Consumes: `Card`, `StatCard`, `IconChevron`, `IconArrow`, aggregate (`monthMovements`, `sumIngresos`, `sumGastos`, `balanceNeto`), `mock` (`categories`), `format`.
- Produces: componente `Movimientos`.

- [ ] **Step 1: Escribir `frontend/src/movimientos/Movimientos.tsx`**

```tsx
import { useState } from 'react'
import { Card } from '../app/Card'
import { StatCard } from '../app/StatCard'
import { IconArrow, IconChevron } from '../lib/icons'
import { categories } from '../lib/mock'
import { balanceNeto, monthMovements, sumGastos, sumIngresos } from '../lib/aggregate'
import { formatCurrency, formatRelativeDateTime } from '../lib/format'
import './movimientos.css'

const catName = new Map(categories.map((c) => [c.id, c.name]))
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function Movimientos() {
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1)
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
  }

  const ms = monthMovements(cursor.year, cursor.month).sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  )
  const ingresos = sumIngresos(ms)
  const gastos = sumGastos(ms)
  const neto = balanceNeto(ms)

  return (
    <>
      <Card
        action={
          <div className="month-nav">
            <button onClick={() => shift(-1)} aria-label="Mes anterior">
              <IconChevron dir="left" />
            </button>
            <span className="month-label">
              {MONTHS[cursor.month]} {cursor.year}
            </span>
            <button onClick={() => shift(1)} aria-label="Mes siguiente">
              <IconChevron dir="right" />
            </button>
          </div>
        }
        title="Movimientos del mes"
      >
        <div className="stat-row">
          <StatCard label="Total ingresos" value={formatCurrency(ingresos)} tone="positive" />
          <StatCard label="Total gastos" value={formatCurrency(gastos)} tone="negative" />
          <StatCard
            label="Balance neto"
            value={formatCurrency(neto)}
            tone={neto >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </Card>

      <Card title={`${ms.length} movimientos`}>
        {ms.length === 0 ? (
          <p className="empty">No hay movimientos este mes.</p>
        ) : (
          <ul className="movement-list">
            {ms.map((m) => {
              const income = m.amount > 0
              return (
                <li key={m.id} className="movement">
                  <span className={`mv-icon ${income ? 'up' : 'down'}`}>
                    <IconArrow />
                  </span>
                  <span className="mv-main">
                    <span className="mv-desc">{m.description}</span>
                    <span className="mv-meta">
                      {catName.get(m.categoryId)} · {formatRelativeDateTime(m.date)}
                    </span>
                  </span>
                  <span className={`mv-amount num ${income ? 'tone-positive' : 'tone-negative'}`}>
                    {formatCurrency(m.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
```

- [ ] **Step 2: Escribir `frontend/src/movimientos/movimientos.css`**

```css
.month-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.month-nav button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--body);
  cursor: pointer;
}
.month-nav button:hover {
  color: var(--ink);
  border-color: var(--primary);
}
.month-label {
  min-width: 10ch;
  text-align: center;
  font-weight: 600;
  color: var(--ink);
}
.empty {
  color: var(--muted);
  padding: var(--space-4) 0;
}

/* Reutiliza .movement-list / .movement / .mv-* de dashboard.css importado globalmente.
   Se redefinen aquí por si Movimientos se carga sin Dashboard. */
.movement-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-1);
}
.movement {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  transition: background 0.15s var(--ease-out-expo);
}
.movement:hover {
  background: var(--surface-raised);
}
.mv-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  background: var(--surface-raised);
}
.mv-icon.up {
  color: var(--primary);
}
.mv-icon.down {
  color: var(--negative);
  transform: rotate(180deg);
}
.mv-main {
  display: grid;
  min-width: 0;
}
.mv-desc {
  color: var(--ink);
  font-weight: 600;
}
.mv-meta {
  font-size: var(--text-sm);
  color: var(--muted);
}
.mv-amount {
  font-weight: 600;
}
```

> Nota DRY: las reglas `.movement*` viven duplicadas en `dashboard.css` y `movimientos.css` a propósito para que cada pantalla sea independiente. Si más adelante se comparten más listas, extraer a `app/app.css`. `// ponytail: duplicación consciente de 2 hojas; unificar si aparece una tercera lista`.

- [ ] **Step 3: Montar Movimientos en el router** — editar `frontend/src/App.tsx`

```tsx
import { Movimientos } from './movimientos/Movimientos'
// ...
{ path: 'movimientos', element: <Movimientos /> },
```

- [ ] **Step 4: Verificar build + visual**

Run: `cd frontend && bun run build && bun run lint`
Expected: sin errores. En `/movimientos`: navegador de mes (‹ Julio 2026 ›), 3 stats del mes, y lista de movimientos del mes seleccionado. Retroceder meses cambia cifras y lista; un mes sin datos muestra el estado vacío.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/movimientos frontend/src/App.tsx
git commit -m "feat(front): pantalla Movimientos (navegador de mes, stats, lista)"
```

---

## Task 9: Pantalla Cartera

**Files:**
- Create: `frontend/src/cartera/Cartera.tsx`, `frontend/src/cartera/cartera.css`
- Modify: `frontend/src/App.tsx` (montar `<Cartera/>`)

**Interfaces:**
- Consumes: `RangeSelector`, `AreaTrend`, `Donut`, `Card`, `StatCard`, aggregate (`capitalInvertidoSeries`, `distribucionPorClase`, `totalCartera`, `assetMetrics`), `mock` (`assets`), `format`, `react-router-dom` (`useNavigate`).
- Produces: componente `Cartera`.

- [ ] **Step 1: Escribir `frontend/src/cartera/Cartera.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RangeSelector } from '../charts/RangeSelector'
import { AreaTrend } from '../charts/AreaTrend'
import { Donut } from '../charts/Donut'
import { Card } from '../app/Card'
import { StatCard } from '../app/StatCard'
import { assets } from '../lib/mock'
import { assetMetrics, capitalInvertidoSeries, distribucionPorClase, totalCartera } from '../lib/aggregate'
import { formatCurrency, formatPercent } from '../lib/format'
import type { Range } from '../lib/range'
import './cartera.css'

export function Cartera() {
  const [range, setRange] = useState<Range>('1A')
  const navigate = useNavigate()
  const serie = capitalInvertidoSeries(range)
  const total = totalCartera()
  const dist = distribucionPorClase()

  return (
    <>
      <Card
        title="Capital invertido"
        action={<RangeSelector value={range} onChange={setRange} />}
        className="hero-card"
      >
        <div className="cartera-hero-head">
          <p className="hero-figure num">{formatCurrency(total.marketValue)}</p>
          <span className={`hero-delta num ${total.pnl >= 0 ? 'tone-positive' : 'tone-negative'}`}>
            {total.pnl >= 0 ? '+' : ''}
            {formatCurrency(total.pnl)} ({formatPercent(total.pnlPct)})
          </span>
        </div>
        <AreaTrend data={serie} height={300} />
      </Card>

      <div className="cartera-lower">
        <Card title="Distribución por clase">
          <Donut data={dist} />
        </Card>

        <Card title="Activos">
          <div className="asset-table">
            <div className="asset-row asset-head">
              <span>Activo</span>
              <span className="ta-r">Participaciones</span>
              <span className="ta-r">Cotización</span>
              <span className="ta-r">Valor</span>
              <span className="ta-r">Rentabilidad</span>
            </div>
            {assets.map((a) => {
              const m = assetMetrics(a)
              const tone = m.pnl >= 0 ? 'tone-positive' : 'tone-negative'
              return (
                <button key={a.id} className="asset-row" onClick={() => navigate(`/cartera/${a.id}`)}>
                  <span className="asset-name">
                    <span className="asset-title">{a.name}</span>
                    <span className="asset-sub">
                      {a.ticker} · {a.class}
                    </span>
                  </span>
                  <span className="ta-r num">{a.shares}</span>
                  <span className="ta-r num">{formatCurrency(a.currentPrice)}</span>
                  <span className="ta-r num">{formatCurrency(m.marketValue)}</span>
                  <span className={`ta-r num ${tone}`}>{formatPercent(m.pnlPct)}</span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Escribir `frontend/src/cartera/cartera.css`**

```css
.cartera-hero-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.hero-figure {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.1;
}
.hero-delta {
  font-size: var(--text-lg);
  font-weight: 600;
}

.cartera-lower {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: var(--space-5);
  align-items: start;
}

.asset-table {
  display: grid;
}
.asset-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--body);
  text-align: left;
  width: 100%;
  cursor: pointer;
  transition: background 0.15s var(--ease-out-expo);
}
button.asset-row:hover {
  background: var(--surface-raised);
}
.asset-head {
  font-size: var(--text-sm);
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: default;
}
.asset-name {
  display: grid;
  min-width: 0;
}
.asset-title {
  color: var(--ink);
  font-weight: 600;
}
.asset-sub {
  font-size: var(--text-sm);
  color: var(--muted);
}
.ta-r {
  text-align: right;
}

@media (max-width: 900px) {
  .cartera-lower {
    grid-template-columns: 1fr;
  }
  .asset-row {
    grid-template-columns: 2fr 1fr 1fr;
  }
  .asset-row > :nth-child(2),
  .asset-row > :nth-child(4) {
    display: none;
  }
}
```

- [ ] **Step 3: Montar Cartera en el router** — editar `frontend/src/App.tsx`

```tsx
import { Cartera } from './cartera/Cartera'
// ...
{ path: 'cartera', element: <Cartera /> },
```

- [ ] **Step 4: Verificar build + visual**

Run: `cd frontend && bun run build && bun run lint`
Expected: sin errores. En `/cartera`: hero con valor total + delta (verde/rojo) + `AreaTrend` del capital invertido, donut de distribución por clase, y tabla de activos. Click en una fila navega a `/cartera/:id`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/cartera/Cartera.tsx frontend/src/cartera/cartera.css frontend/src/App.tsx
git commit -m "feat(front): pantalla Cartera (capital invertido, distribución, activos)"
```

---

## Task 10: Pantalla Detalle de activo

**Files:**
- Create: `frontend/src/cartera/AssetDetail.tsx`
- Modify: `frontend/src/cartera/cartera.css` (añadir estilos de detalle), `frontend/src/App.tsx` (montar `<AssetDetail/>`)

**Interfaces:**
- Consumes: `RangeSelector`, `AreaTrend`, `Card`, `StatCard`, `IconChevron`, aggregate (`assetMetrics`), `mock` (`assets`, `priceHistory`, `assetTransactions`), `range` (`rangeStart`), `format`, `react-router-dom` (`useParams`, `Link`).
- Produces: componente `AssetDetail`.

- [ ] **Step 1: Escribir `frontend/src/cartera/AssetDetail.tsx`**

```tsx
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RangeSelector } from '../charts/RangeSelector'
import { AreaTrend } from '../charts/AreaTrend'
import { Card } from '../app/Card'
import { StatCard } from '../app/StatCard'
import { IconChevron } from '../lib/icons'
import { assets, assetTransactions, priceHistory } from '../lib/mock'
import { assetMetrics } from '../lib/aggregate'
import { rangeStart, type Range } from '../lib/range'
import { formatCurrency, formatFullDate, formatPercent } from '../lib/format'
import './cartera.css'

export function AssetDetail() {
  const { id } = useParams()
  const [range, setRange] = useState<Range>('1A')
  const asset = assets.find((a) => a.id === id)

  if (!asset) {
    return (
      <Card>
        <p className="empty">Activo no encontrado.</p>
        <Link to="/cartera" className="back-link">
          <IconChevron dir="left" size={16} /> Volver a Cartera
        </Link>
      </Card>
    )
  }

  const metrics = assetMetrics(asset)
  const serie = priceHistory(asset.id).filter((p) => p.t >= rangeStart(range))
  const first = serie.length ? serie[0].v : asset.currentPrice
  const variacion = asset.currentPrice - first
  const variacionPct = first === 0 ? 0 : variacion / first
  const txs = assetTransactions(asset.id)
  const tone = metrics.pnl >= 0 ? 'tone-positive' : 'tone-negative'

  return (
    <>
      <Link to="/cartera" className="back-link">
        <IconChevron dir="left" size={16} /> Volver a Cartera
      </Link>

      <Card
        title={`${asset.name} · ${asset.ticker}`}
        action={<RangeSelector value={range} onChange={setRange} />}
        className="hero-card"
      >
        <div className="cartera-hero-head">
          <p className="hero-figure num">{formatCurrency(asset.currentPrice)}</p>
          <span className={`hero-delta num ${variacion >= 0 ? 'tone-positive' : 'tone-negative'}`}>
            {variacion >= 0 ? '+' : ''}
            {formatCurrency(variacion)} ({formatPercent(variacionPct)}) · {range}
          </span>
        </div>
        <AreaTrend data={serie} height={300} />
      </Card>

      <div className="stat-row">
        <StatCard label="Cotización" value={formatCurrency(asset.currentPrice)} />
        <StatCard label="Valor de mercado" value={formatCurrency(metrics.marketValue)} />
        <StatCard label="Posiciones" value={`${asset.shares}`} sub={`${asset.class}`} />
        <StatCard
          label="Rentabilidad"
          value={formatCurrency(metrics.pnl)}
          sub={formatPercent(metrics.pnlPct)}
          tone={metrics.pnl >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <Card title="Historial de transacciones">
        <div className="tx-table">
          <div className="tx-row tx-head">
            <span>Fecha</span>
            <span>Tipo</span>
            <span className="ta-r">Cantidad</span>
            <span className="ta-r">Precio</span>
            <span className="ta-r">Comisión</span>
            <span className="ta-r">Total</span>
          </div>
          {txs.map((t) => {
            const total = t.shares * t.price + t.fee
            return (
              <div key={t.id} className="tx-row">
                <span>{formatFullDate(t.date)}</span>
                <span className={t.type === 'compra' ? 'tone-positive' : 'tone-negative'}>{t.type}</span>
                <span className="ta-r num">{t.shares}</span>
                <span className="ta-r num">{formatCurrency(t.price)}</span>
                <span className="ta-r num">{formatCurrency(t.fee)}</span>
                <span className="ta-r num">{formatCurrency(total)}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
```

- [ ] **Step 2: Añadir estilos de detalle a `frontend/src/cartera/cartera.css`** (append)

```css
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--muted);
  font-size: var(--text-sm);
  font-weight: 600;
  width: fit-content;
}
.back-link:hover {
  color: var(--ink);
}

.tx-table {
  display: grid;
}
.tx-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr 1fr;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
}
.tx-row:not(.tx-head):hover {
  background: var(--surface-raised);
}
.tx-head {
  font-size: var(--text-sm);
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@media (max-width: 900px) {
  .tx-row {
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
  }
  .tx-row > :nth-child(3),
  .tx-row > :nth-child(5) {
    display: none;
  }
}
```

- [ ] **Step 3: Montar AssetDetail en el router** — editar `frontend/src/App.tsx`

```tsx
import { AssetDetail } from './cartera/AssetDetail'
// ...
{ path: 'cartera/:id', element: <AssetDetail /> },
```

- [ ] **Step 4: Verificar build + visual**

Run: `cd frontend && bun run build && bun run lint`
Expected: sin errores. Desde `/cartera`, click en un activo abre `/cartera/:id`: enlace de vuelta, hero con precio + variación por rango + `AreaTrend` de cotización, 4 stats (cotización, valor de mercado, posiciones, rentabilidad) e historial de transacciones (compra verde / venta rojo). Ir a `/cartera/xxx` inexistente muestra "Activo no encontrado" + enlace.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/cartera/AssetDetail.tsx frontend/src/cartera/cartera.css frontend/src/App.tsx
git commit -m "feat(front): pantalla Detalle de activo (cotización, métricas, transacciones)"
```

---

## Self-Review

**Spec coverage:**
- Pantalla 1 Dashboard (chart patrimonio, capital invertido/gastos/ingresos por rango, donut categorías, últimos movimientos) → Task 7. ✔
- Pantalla 2 Cartera (chart capital invertido, distribución por clase, lista activos con participaciones/cotización/rentabilidad) → Task 9. ✔
- Pantalla 3 Movimientos (ingresos/gastos/neto mensual, lista con importe/categoría/fecha) → Task 8. ✔
- Pantalla 4 Detalle de activo (chart cotización, precio/valor/posiciones/rentabilidad, historial transacciones con cantidad/precio/comisión) → Task 10. ✔
- Plantilla con nav lateral entre las 3 + logo/título arriba → Task 6. ✔
- Rangos 1D/1S/1M/3M/6M/1A/3A/Todo controlando gráfico + stats → Tasks 2, 5, 7, 9, 10. ✔
- Datos mock deterministas → Task 3. ✔
- Design system (tokens, tema, fuentes, `.num`) → Tasks 1, 5, 6. ✔

**Placeholder scan:** El único "placeholder" es intencional y documentado: los chips de perfil/ajustes de la topbar (fuera de alcance por spec) y los elementos `Placeholder` del router que se reemplazan en Tasks 7-10. Sin TODO/TBD en código de entrega.

**Type consistency:** `Point = {t, v}`, `Segment = {label, value, color}`, `Metrics = {marketValue, cost, pnl, pnlPct}`, `Range` y firmas de aggregate/mock son consistentes entre tareas. `assetMetrics(asset)`, `totalCartera()`, `capitalInvertidoSeries(range)`, `patrimonioSeries(range)`, `gastosPorCategoria(ms)`, `distribucionPorClase()` usadas con los mismos nombres en Tasks 7/9/10.

## Execution Handoff

Plan completo y guardado. Nota: el CSS de listas de movimientos se duplica a propósito entre `dashboard.css` y `movimientos.css` (marcado con `// ponytail:`); es la opción lazy correcta hasta que aparezca una tercera lista.
