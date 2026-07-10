# Product

## Register

product

## Users

Carlos Parra Camacho — único usuario de Vesta Web, en su propia red doméstica, en un navegador de escritorio. Abre la app para registrar movimientos, revisar su cartera de inversión y ver el estado de su patrimonio. No hay multiusuario, ni onboarding, ni pantallas de venta: la app se usa a diario por su propio autor.

## Product Purpose

Entender y hacer crecer el patrimonio personal desde el navegador: unifica el registro de movimientos (ingresos/gastos), el seguimiento de la cartera de inversión (activos cotizados vía API y no cotizados valorados a mano) y la visualización del patrimonio total en un panel claro. Vesta observa y visualiza; no ejecuta operaciones ni asesora. Es también el banco de pruebas del dominio y del sistema de diseño para "Vesta mobile" (proyecto comercial posterior).

## Brand Personality

Confianza institucional lograda por precisión y contención, no por los clichés bancarios clásicos — más cerca del rigor tipográfico de Linear, la densidad de datos bien resuelta de Mercury/Ramp y los gráficos minimalistas de Apple Stocks. Serio, calmado, exacto. Los números son el protagonista; el "chrome" de la interfaz se queda callado.

## Anti-references

- SaaS genérico: tarjetas idénticas, gradientes, iconos de stock, look de plantilla.
- Banca corporate clásica: azul marino + dorado, folleto de banco tradicional.
- Excel/hoja de cálculo cruda: tablas densas sin ninguna jerarquía visual.

## Design Principles

1. **Los números son la interfaz** — cada pantalla debe dejar legible el estado financiero actual de un vistazo, no como adorno.
2. **Precisión antes que decoración** — la confianza se gana con rigor tipográfico y de datos, no con floritura visual.
3. **Densidad calmada** — mostrar densidad de datos real (paneles, tablas) sin que se sienta como una hoja de cálculo cruda.
4. **Un usuario, cero fricción** — sin chrome de autenticación, embudos de onboarding ni "empty states" de venta; la app la usa su propio autor.
5. **Reutilizable ahora, móvil después** — los patrones de UI de dominio de aquí son un ensayo para Vesta mobile: se cuida el sistema de diseño, no solo las pantallas.

## Accessibility & Inclusion

Un único usuario de escritorio, sin necesidades de accesibilidad específicas declaradas. Aun así, se mantiene el contraste mínimo WCAG AA (≥4.5:1 en texto de cuerpo) — con tema oscuro y datos financieros de por medio, un fallo de contraste es fácil y caro. Se respeta `prefers-reduced-motion` en toda animación.
