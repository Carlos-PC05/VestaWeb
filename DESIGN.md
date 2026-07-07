---
name: Vesta Web
description: Panel de patrimonio personal — precisión antes que decoración.
---

# Design System: Vesta Web

> Tokens implementados en `frontend/src/index.css` (tokens semánticos que conmutan
> por `[data-theme]`) y en `frontend/src/app/app.css` / `charts/charts.css`. Este
> documento es la referencia; el CSS es la fuente de verdad de los valores.

## 1. Overview

**Creative North Star: "El terminal de confianza"**

Vesta Web es un panel financiero de uso diario, no un escaparate. La confianza no se declara con azul marino y dorado — se demuestra con precisión: cifras que alinean en columna, jerarquía clara entre lo que importa ahora (patrimonio total, evolución, gastos del mes) y el resto, y una interfaz que se queda callada para dejar hablar a los datos. El verde esmeralda aparece solo donde hay que señalar algo — una ganancia, una acción — y en ningún otro sitio; su escasez es lo que le da peso.

Rechaza explícitamente la banca corporate clásica (folleto azul marino + dorado), el SaaS genérico (tarjetas idénticas, gradientes, iconos de stock) y la hoja de cálculo cruda (tablas densas sin ninguna jerarquía). **Dos temas conmutables** (claro y oscuro, HU-W05.02): el oscuro es la identidad principal (teal casi negro), el claro un equivalente legible con el mismo verde de marca oscurecido. La preferencia se guarda y por defecto sigue al sistema.

**Key Characteristics:**
- Neutros con matiz teal en ambos temas — nunca negro puro ni gris frío desangelado.
- Un único acento (verde esmeralda) para ganancias, foco y llamadas a la acción puntuales.
- Cifras con numeración tabular (`tabular-nums`, clase `.num`) para que las columnas alineen; display en Outfit, resto en Plus Jakarta Sans.
- Movimiento "responsive": feedback y transiciones claras, cero coreografía.
- Densidad calmada: caben tablas y paneles de datos reales sin sentirse como Excel.

## 2. Colors

Estrategia **Contenida**: neutros con matiz de marca + un único acento que nunca supera ~10% de la superficie. Todos los pares texto/fondo verificados a WCAG AA por cálculo en ambos temas. Valores canónicos en `frontend/src/index.css`.

### Primary

- **Verde esmeralda** — acento único (ganancias, foco, CTAs). Dark `#00D09E` (brillante `#44EDB9`); light `#00795C` (oscurecido para pasar contraste sobre fondo claro). No se usa como fondo extenso.

### Neutral (dark / light)

- **Fondo base** `#020B0C` / `#F4FAFA` — teal casi negro / blanco con matiz teal.
- **Superficie / panel** `#062325` / `#FFFFFF`; elevado `#0D3D41` / `#E4F0F0`.
- **Texto principal (ink)** `#FFFFFF` / `#04211F`; **cuerpo** `#BACAC1` / `#123634`; **muted** `#A0B1B2` / `#4C6664` (todos ≥AA).
- **Borde / divisor** `#164A4E` / `#CBE0E0` — discreto en reposo; la jerarquía la da el espaciado.
- **Negativo (pérdida / gasto)** `#FF4B4B` / `#C0362F` — única otra señal de color, reservada a pérdidas y gastos.
- **Ramp de categorías / clases de activo** (`--cat-1..6`): verdes/azules para segmentos de donut, sin texto encima.

### Named Rules

**La Regla del Acento Único.** El verde esmeralda aparece en ≤10% de cualquier pantalla. Fuera de ganancias/CTA puntual, no se usa ni en fondos ni en iconografía decorativa.

**La Regla del Rojo Contenido.** El rojo de pérdida/gasto es la única excepción al acento único, y solo aparece junto a una cifra negativa — nunca como color de marca ni de estado neutro.

## 3. Typography

**Display Font:** `Outfit` (títulos, cifras hero) — self-hosted en `frontend/public/fonts/`.
**Body/UI Font:** `Plus Jakarta Sans` — texto de interfaz, etiquetas, datos. También self-hosted.
Ambas son variable fonts (eje de peso 300–800). Sin fuentes de Google en runtime (app local).

**Character:** dos sans que contrastan por proporción (Outfit más geométrico y ancho en display, Plus Jakarta Sans más neutro para UI densa). Las cifras se distinguen como datos por su **numeración tabular**, no por una fuente aparte.

### Hierarchy (escala rem fija, registro product)

- **Display** (Outfit 600, `--text-display` 3rem): patrimonio total, cifras hero.
- **Headline** (Outfit 600, `--text-2xl` 1.5rem): títulos de sección.
- **Title** (Outfit 600, `--text-lg` 1.125rem): cabeceras de tarjeta.
- **Body** (Plus Jakarta Sans, `--text-base` 1rem): texto de interfaz.
- **Label** (`--text-sm` 0.75rem, a menudo en mayúsculas con tracking): etiquetas, metadatos.

### Named Rules

**La Regla del Número Tabular.** Toda cifra financiera (importes, porcentajes, precios) lleva la clase `.num` (`font-variant-numeric: tabular-nums`) para que las columnas alineen y se lean de un vistazo.

## 4. Elevation

Sistema mayormente plano: la jerarquía entre fondo y panel se resuelve con un salto sutil de luminosidad (neutro base → superficie), no con sombra. La sombra, si aparece, es una respuesta a un estado (hover, foco, un menú flotante) y nunca decora una tarjeta en reposo.

### Named Rules

**La Regla de lo Plano en Reposo.** Ninguna tarjeta ni panel lleva `box-shadow` por defecto. La sombra solo aparece como reacción a una interacción.

## 6. Do's and Don'ts

### Do:

- **Do** poner la clase `.num` (numeración tabular) en toda cifra financiera, sin excepción.
- **Do** mantener el verde esmeralda por debajo del 10% de cualquier pantalla.
- **Do** usar los tokens semánticos (`--bg`, `--surface`, `--ink`…) — nunca hex crudo — para que ambos temas funcionen.
- **Do** resolver la jerarquía con espaciado y luminosidad, no con bordes ni sombras decorativas.
- **Do** respetar `prefers-reduced-motion` en toda transición.
- **Do** verificar contraste WCAG AA (≥4.5:1) al añadir/ajustar colores, en los DOS temas.

### Don't:

- **Don't** usar azul marino + dorado ni ningún otro cliché de "banca corporate clásica" — es la anti-referencia principal del proyecto.
- **Don't** construir pantallas con tarjetas idénticas, gradientes o iconos de stock — el look "SaaS genérico" que PRODUCT.md rechaza explícitamente.
- **Don't** presentar datos como una hoja de cálculo cruda: toda tabla necesita jerarquía tipográfica y espaciado, no solo filas y columnas.
- **Don't** usar `border-left`/`border-right` como franja de acento decorativa.
- **Don't** usar texto con gradiente (`background-clip: text`).
- **Don't** aplicar glassmorphism como estilo por defecto.
- **Don't** animar con coreografías o scroll-driven sequences — la energía de movimiento de este sistema es "responsive", no "choreographed".
