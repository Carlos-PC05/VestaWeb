# Mejoras de frontend — perfil/ajustes, botones "Añadir", menú móvil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Aplica las skills de frontend (`impeccable`, `frontend-design`, `design-taste-frontend`) al construir UI y `documentation-pro` al documentar.

**Goal:** Cerrar tres huecos de UI en Vesta Web, en **3 iteraciones independientes**, con componentes **presentacionales** (sin lógica de negocio todavía):
1. Botones de **perfil** y **ajustes** en la topbar (hoy son dos chips vacíos `aria-hidden`).
2. Botones **"Añadir movimiento"** (Movimientos) y **"Añadir activo"** (Cartera).
3. **Menú hamburguesa** en móvil (top bar + drawer deslizante) que sustituya la sidebar recolocada actual.

Los botones de perfil/ajustes/añadir se crean **sin acción** por ahora — en el futuro navegarán a formularios/pantallas.

**Tech Stack:** Vite + React 19 + TypeScript, `react-router-dom` v7, `recharts`, CSS plano con tokens semánticos, `bun` (runtime; `bun test` para lógica pura). Iconos = SVG inline propios en `frontend/src/lib/icons.tsx` (helper `base(size)`), sin librería externa.

## Global Constraints (de `DESIGN.md`)

- **Solo tokens semánticos** en CSS (`--bg`, `--surface`, `--surface-raised`, `--border`, `--ink`, `--body`, `--muted`, `--primary`, `--primary-on`, `--negative`, `--radius-*`, `--space-*`, `--ease-out-expo`, `--z-*`). Nunca hex crudo.
- Acento verde (`--primary`) ≤10% de pantalla; reservado a ganancias/foco/CTA puntual. Rojo solo junto a cifra negativa.
- **Plano en reposo:** sin `box-shadow` decorativa; sombra solo en hover/foco/flotantes.
- Respetar `prefers-reduced-motion` en toda transición (ya hay bloque global en `index.css`).
- Copy de UI en **español (España)**.
- Contraste WCAG AA en **ambos** temas (claro/oscuro).
- Sin dependencias nuevas. Iconos nuevos como SVG inline siguiendo `base()`.
- JSDoc de cabecera en español al estilo de `Card.tsx` / `AppLayout.tsx` para todo componente/función nuevos.

## Archivos clave (referencia)

- `frontend/src/app/AppLayout.tsx` — shell: sidebar (marca + `NAV` + toggle tema) + topbar (`.topbar-actions` con 2 `.topbar-chip` vacíos) + `<Outlet/>`.
- `frontend/src/app/app.css` — estilos del shell; único `@media (max-width: 720px)` al final (reflow de sidebar).
- `frontend/src/app/Card.tsx` — panel con slot `action` en la cabecera (`.card-head`).
- `frontend/src/lib/icons.tsx` — iconos SVG inline (`base(size)`, viewBox 24, `stroke: currentColor`, trazo 1.8).
- `frontend/src/movimientos/Movimientos.tsx` — 2ª `Card` con `title={\`${ms.length} movimientos\`}` (sin `action`).
- `frontend/src/cartera/Cartera.tsx` — `Card title="Activos"` (sin `action`).
- `frontend/src/lib/useTheme.ts` — hook de tema (`resolved`, `setPreference`).

---

## Iteración 1 — Iconos de perfil y ajustes en la topbar

Sustituir los dos `.topbar-chip` vacíos por botones-icono reales (perfil + ajustes), **visuales, sin acción**, pero accesibles (aria/hover/foco).

- [ ] **Task 1.1** — En `icons.tsx`, añadir `IconUser` (perfil: círculo cabeza + arco hombros) e `IconSettings` (rueda dentada) siguiendo `base(size)`.
- [ ] **Task 1.2** — En `AppLayout.tsx`, reemplazar `<div className="topbar-actions" aria-hidden="true">` + los dos `<span className="topbar-chip" />` por dos `<button type="button" className="topbar-btn" aria-label="…">` con `<IconUser/>` / `<IconSettings/>` (aria-label "Perfil" / "Ajustes"). Quitar `aria-hidden`. Sin `onClick` (comentario `// TODO: perfil/ajustes`).
- [ ] **Task 1.3** — En `app.css`, sustituir la regla `.topbar-chip` por `.topbar-btn`: círculo ~36px (`border-radius: var(--radius-full)`), `background: var(--surface-raised)`, `border: 1px solid var(--border)`, `color: var(--body)`, `display: grid; place-items: center`, `cursor: pointer`; hover → `color: var(--ink)` + `border-color: var(--primary)` (mismo lenguaje que `.theme-toggle`, plano en reposo, sin verde de fondo).
- [ ] **Task 1.4** — Documentar (`documentation-pro`) los iconos nuevos si procede y verificar (ver Verificación It.1).

---

## Iteración 2 — Botones "Añadir" en Movimientos y Cartera

CTA "Añadir movimiento" / "Añadir activo" en el slot `action` de la `Card` correspondiente. **Sin funcionalidad** (sin `onClick`; comentario `// TODO: navegar al formulario de alta`).

- [ ] **Task 2.1** — Crear `frontend/src/app/Button.tsx`: componente tipado `Button` (`children`, `variant?: 'primary' | 'ghost'`, `icon?: ReactNode`, y `...rest` de props nativas de `<button>`; `type` por defecto `"button"`). Sigue el idiom de `Card.tsx`. JSDoc de cabecera en español.
- [ ] **Task 2.2** — En `icons.tsx`, añadir `IconPlus` (`M12 5v14M5 12h14`).
- [ ] **Task 2.3** — En `app.css` (zona "Piezas compartidas"), añadir `.btn` (base: flex, gap, padding compacto, `border-radius: var(--radius-md)`, `font-weight: 600`, `font-size: var(--text-sm)`, transición con `--ease-out-expo`), `.btn-primary` (`background: var(--primary)`; `color: var(--primary-on)`; hover sutil) y `.btn-ghost` (transparente + borde, como `.theme-toggle`). CTA verde compacto = uso permitido del acento.
- [ ] **Task 2.4** — En `Movimientos.tsx`, pasar `action={<Button variant="primary" icon={<IconPlus />}>Añadir movimiento</Button>}` a la 2ª `Card`.
- [ ] **Task 2.5** — En `Cartera.tsx`, pasar `action={<Button variant="primary" icon={<IconPlus />}>Añadir activo</Button>}` a la `Card title="Activos"`.
- [ ] **Task 2.6** — Comprobar que `.card-head` permite `flex-wrap` en pantallas estrechas para que título + botón no se solapen. Documentar y verificar.

---

## Iteración 3 — Menú hamburguesa en móvil (top bar + drawer deslizante)

En móvil (`≤720px`): ocultar la sidebar, mostrar una top bar compacta (marca + hamburguesa). La hamburguesa abre un **drawer deslizante** con: nav (Dashboard/Movimientos/Cartera), toggle de tema y botones perfil/ajustes (It.1). Backdrop que cierra al pulsar. Escritorio **sin cambios**.

- [ ] **Task 3.1** — En `icons.tsx`, añadir `IconMenu` (3 líneas) e `IconClose` (X).
- [ ] **Task 3.2** — En `AppLayout.tsx`, refactor para no duplicar UI: extraer fragmentos reutilizables `NavList` (el `NAV.map` de `NavLink`s, con `onNavigate?` para cerrar el drawer al pulsar), `ThemeToggle`, y los botones perfil/ajustes, de modo que se rendericen tanto en la sidebar de escritorio como en el drawer.
- [ ] **Task 3.3** — En `AppLayout.tsx`, añadir estado `const [menuOpen, setMenuOpen] = useState(false)`. Renderizar:
  - `.mobile-topbar` (marca "Vesta" + `<button className="burger" aria-label="Abrir menú" aria-expanded={menuOpen} aria-controls="mobile-drawer">` con `IconMenu`).
  - `<div className="drawer-backdrop" onClick={cerrar}>` + `<aside id="mobile-drawer" className="drawer" role="dialog" aria-modal="true">` con botón de cierre (`IconClose`), `NavList` (cierra al navegar), `ThemeToggle`, perfil/ajustes.
  - Alternar clase `is-open` según `menuOpen`.
- [ ] **Task 3.4** — Cierre del drawer: clic en backdrop, clic en `NavLink`, tecla `Escape` (listener en `useEffect`), botón de cierre. Opcional: bloquear scroll del body mientras esté abierto.
- [ ] **Task 3.5** — En `app.css`, `.mobile-topbar`, `.burger`, `.drawer`, `.drawer-backdrop` con `display: none` por defecto (escritorio). Reescribir `@media (max-width: 720px)`:
  - Ocultar `.sidebar`; mostrar `.mobile-topbar` (sticky, con marca + burger).
  - `.drawer`: `position: fixed`, ancho `min(82vw, 320px)`, `transform: translateX(-100%)` → `translateX(0)` en `.is-open`, `transition: transform` con `--ease-out-expo`, `z-index: var(--z-modal)`.
  - `.drawer-backdrop`: overlay `color-mix(in srgb, var(--bg) 60%, transparent)`, fade, `z-index` justo por debajo del drawer; solo visible con `.is-open`.
  - Ajustar padding superior de `.content` para la top bar.
  - Dentro de `@media (prefers-reduced-motion: reduce)`, desactivar la transición del `transform` (aparición instantánea).
- [ ] **Task 3.6** — Documentar (`documentation-pro`) la lógica del drawer y los fragmentos extraídos. Nota breve en `DESIGN.md` si el patrón del drawer/`Button` lo merece. Verificar.

---

## Verification

Desde `frontend/`:

- **It.1** — `bun run dev`: en escritorio la topbar muestra 2 botones-icono (perfil/ajustes) con hover y foco; `Tab` los alcanza y anuncia sus `aria-label`. Bien en ambos temas.
- **It.2** — Movimientos muestra "Añadir movimiento" en la cabecera de la tarjeta de la lista; Cartera muestra "Añadir activo" en la tarjeta de Activos. Pulsarlos no hace nada (esperado). Verde solo en esos CTA (regla ≤10%). Bien en ambos temas.
- **It.3** — Reducir a ≤720px: la sidebar desaparece, aparece top bar con hamburguesa; abrir → drawer entra deslizando con nav + tema + perfil/ajustes; cierra con backdrop, `Escape` y al pulsar un enlace (que además navega). Probar con `prefers-reduced-motion` (sin animación). Escritorio sin cambios.
- **Global** — `bun run build` (`tsc -b && vite build`) sin errores de tipos; `bun run lint` limpio. Revisión visual en ambos temas.
